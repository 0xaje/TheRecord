// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {TheRecord} from "../contracts/TheRecord.sol";

interface Vm {
    function expectRevert(bytes4 selector) external;
    function prank(address sender) external;
    function envString(string calldata name) external returns (string memory);
    function createSelectFork(string calldata url, uint256 blockNumber) external returns (uint256);
}

contract TheRecordTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    TheRecord private record;
    bytes32 private id;
    bytes32 private constant ORIGINAL = keccak256("original terms");
    bytes32 private constant EDITED = keccak256("amended terms");
    address private constant FIRST = address(0x1001);
    address private constant SECOND = address(0x1002);

    function setUp() public {
        record = new TheRecord();
        id = record.create(bytes32(uint256(1)), FIRST, SECOND, ORIGINAL);
    }

    function testOutsiderCannotProposeAmendment() public {
        vm.expectRevert(TheRecord.InvalidAgreement.selector);
        vm.prank(address(0x1003));
        record.amend(id, EDITED);
    }

    function testProposerCannotAmendPendingVersion() public {
        vm.expectRevert(TheRecord.InvalidVersion.selector);
        record.amend(id, EDITED);
    }

    function testRejectsUndesignatedSigner() public {
        vm.expectRevert(TheRecord.InvalidApproval.selector);
        record.approve(id, 1, address(0x1003), new bytes(4627));
    }

    function testRejectsMalformedSignature() public {
        vm.expectRevert(TheRecord.InvalidApproval.selector);
        record.approve(id, 1, FIRST, hex"01");
    }

    function testApprovalPayloadBindsSigner() public view {
        require(keccak256(record.approvalData(id, 1, FIRST)) !=
            keccak256(record.approvalData(id, 1, SECOND)), "same signer payload");
    }

    function testDianaFinalizedAmendmentPreservesOriginal() public {
        vm.createSelectFork(vm.envString("DIANA_RPC_URL"), 10163721);
        TheRecord deployed = TheRecord(0x25721b3Be0F24438DA7DAEd4C800B073ef9BB802);
        bytes32 agreement = 0x9544256601f5e7ac4e4fc33e45688be912e50395ca0b826a55aea7209f81954e;
        (bytes32 original, uint8 firstMask, bool firstFinal) = deployed.getVersion(agreement, 1);
        (bytes32 amended, uint8 secondMask, bool secondFinal) = deployed.getVersion(agreement, 2);
        require(original == 0x265716da974845a4efb3cac9471865969f22878da81b99e81a8aaa7349e480fd);
        require(amended == 0x66007b246f8885ac7bb25c54757d6ee20d619ca148ef85fea64d0f091d713ee0);
        require(firstMask == 3 && secondMask == 3 && firstFinal && secondFinal);
    }
}
