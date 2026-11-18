// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IQorePQC {
    function pqcKeyStatus(address account) external view returns (bool, uint8, bytes memory, bool);
    function pqcVerify(bytes calldata key, bytes calldata signature, bytes calldata message)
        external view returns (bool);
}

contract TheRecordV2 {
    struct Version {
        bytes32 fingerprint;
        uint8 approvals;
        bool withdrawn;
    }

    struct Agreement {
        address proposer;
        address first;
        address second;
        uint256 latest;
        uint256 latestFinalized;
        mapping(uint256 => Version) versions;
    }

    IQorePQC private constant KEY_STATUS = IQorePQC(address(0x0A02));
    IQorePQC private constant VERIFY = IQorePQC(address(0x0A01));
    bytes32 private constant APPROVAL_DOMAIN = keccak256("TheRecord:approve:sha256:v1");
    bytes32 private constant WITHDRAWAL_DOMAIN = keccak256("TheRecord:withdraw:sha256:v1");
    mapping(bytes32 => Agreement) private agreements;

    error InvalidAgreement();
    error InvalidVersion();
    error InvalidApproval();

    event Proposed(bytes32 indexed id, uint256 indexed version, bytes32 fingerprint);
    event Approved(bytes32 indexed id, uint256 indexed version, address indexed signer);
    event Withdrawn(bytes32 indexed id, uint256 indexed version, address indexed proposer);

    event Finalized(bytes32 indexed id, uint256 indexed version, bytes32 fingerprint);

    function create(bytes32 salt, address first, address second, bytes32 fingerprint) external returns (bytes32 id) {
        id = keccak256(abi.encode(msg.sender, first, second, salt));
        Agreement storage agreement = agreements[id];
        if (first == address(0) || second == address(0) || first == second || agreement.latest != 0) {
            revert InvalidAgreement();
        }
        agreement.proposer = msg.sender;
        agreement.first = first;
        agreement.second = second;
        propose(id, agreement, fingerprint);
    }

    function amend(bytes32 id, bytes32 fingerprint) external {
        Agreement storage agreement = agreements[id];
        if (msg.sender != agreement.proposer) revert InvalidAgreement();
        Version storage latest = agreement.versions[agreement.latest];
        if (latest.approvals != 3 && !latest.withdrawn) revert InvalidVersion();
        propose(id, agreement, fingerprint);
    }

    function propose(bytes32 id, Agreement storage agreement, bytes32 fingerprint) private {
        if (fingerprint == bytes32(0) || agreement.versions[agreement.latestFinalized].fingerprint == fingerprint) {
            revert InvalidVersion();
        }
        uint256 version = ++agreement.latest;
        agreement.versions[version].fingerprint = fingerprint;
        emit Proposed(id, version, fingerprint);
    }

    // Explicit version prevents a delayed wallet request withdrawing a later proposal.
    // Withdrawal is PQ-authorized by the proposer, separate from agreement approval.
    function withdrawalData(bytes32 id, uint256 version) public view returns (bytes memory) {
        Agreement storage agreement = agreements[id];
        Version storage record = agreement.versions[version];
        if (version <= 1 || version != agreement.latest || record.withdrawn || record.approvals == 3) {
            revert InvalidVersion();
        }
        return abi.encode(WITHDRAWAL_DOMAIN, block.chainid, address(this), id, version, record.fingerprint, agreement.proposer);
    }

    function withdraw(bytes32 id, uint256 version, bytes calldata signature) external {
        Agreement storage agreement = agreements[id];
        if (msg.sender != agreement.proposer) revert InvalidAgreement();
        bytes memory payload = withdrawalData(id, version);
        if (signature.length != 4627) revert InvalidApproval();
        verifyApproval(msg.sender, signature, payload);
        agreement.versions[version].withdrawn = true;
        emit Withdrawn(id, version, msg.sender);
    }

    function getVersionState(bytes32 id, uint256 version) external view
        returns (bytes32 fingerprint, uint8 approvals, bool finalized, bool withdrawn)
    {
        Version storage record = agreements[id].versions[version];
        return (record.fingerprint, record.approvals, record.approvals == 3, record.withdrawn);
    }

    function approvalData(bytes32 id, uint256 version, address signer) public view returns (bytes memory) {
        if (agreements[id].versions[version].withdrawn) revert InvalidVersion();
        bytes32 fingerprint = agreements[id].versions[version].fingerprint;
        if (fingerprint == bytes32(0)) revert InvalidVersion();
        return abi.encode(APPROVAL_DOMAIN, block.chainid, address(this), id, version, fingerprint, signer);
    }

    function approve(bytes32 id, uint256 version, address signer, bytes calldata signature) external {
        Agreement storage agreement = agreements[id];
        if (version == 0 || version != agreement.latest || agreement.versions[version].withdrawn) revert InvalidVersion();
        uint8 bit;
        if (signer == agreement.first) bit = 1;
        else if (signer == agreement.second) bit = 2;
        else revert InvalidApproval();

        Version storage record = agreement.versions[version];
        if ((record.approvals & bit) != 0 || signature.length != 4627) revert InvalidApproval();
        verifyApproval(signer, signature, approvalData(id, version, signer));

        record.approvals |= bit;
        emit Approved(id, version, signer);
        if (record.approvals == 3) {
            agreement.latestFinalized = version;
            emit Finalized(id, version, record.fingerprint);
        }
    }

    function verifyApproval(address signer, bytes calldata signature, bytes memory payload) private view {
        (bool registered, uint8 algorithm, bytes memory key, bool possessionProven) =
            KEY_STATUS.pqcKeyStatus(signer);
        if (!registered || algorithm != 1 || !possessionProven || key.length != 2592) revert InvalidApproval();
        if (!VERIFY.pqcVerify(key, signature, bytes.concat(
            bytes("qorechain-msg-v1|qorechain-diana|"), payload
        ))) revert InvalidApproval();
    }

    function getVersion(bytes32 id, uint256 version)
        external view returns (bytes32 fingerprint, uint8 approvals, bool finalized)
    {
        Version storage record = agreements[id].versions[version];
        return (record.fingerprint, record.approvals, record.approvals == 3);
    }
}
