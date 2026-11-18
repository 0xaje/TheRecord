// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;
import {TheRecordV2} from '../contracts/TheRecordV2.sol';
interface VmV2 {
    function expectRevert(bytes4) external;
    function prank(address) external;
    function store(address, bytes32, bytes32) external;
    function chainId(uint256) external;
}
// These tests seed lifecycle storage to isolate state rules. They do not mock
// Diana precompiles or claim a successful PQ signature/withdrawal on chain.
contract TheRecordV2Test {
    VmV2 constant vm = VmV2(address(uint160(uint256(keccak256('hevm cheat code')))));
    TheRecordV2 r;
    bytes32 id;
    bytes32 constant ORIGINAL = keccak256('Original');
    bytes32 constant UPDATE = keccak256('Pending');
    bytes32 constant FIXED = keccak256('Corrected');
    address constant FIRST = address(0x1001);
    address constant SECOND = address(0x1002);
    function setUp() public { r = new TheRecordV2(); id = r.create(bytes32(uint256(1)),FIRST,SECOND,ORIGINAL); }
    function base() internal view returns(uint256) { return uint256(keccak256(abi.encode(id,uint256(0)))); }
    function versionSlot(uint256 v) internal view returns(bytes32) { return keccak256(abi.encode(v,base()+5)); }
    function flags(uint256 v,uint256 value) internal { vm.store(address(r),bytes32(uint256(versionSlot(v))+1),bytes32(value)); }
    function finalizeFirst() internal { flags(1,3);vm.store(address(r),bytes32(base()+4),bytes32(uint256(1))); }
    function pending() internal { finalizeFirst();r.amend(id,UPDATE); }
    function testCannotWithdrawInitialAgreement() public { vm.expectRevert(TheRecordV2.InvalidVersion.selector);r.withdraw(id,1,new bytes(4627)); }
    function testOnlyProposerCanWithdraw() public { pending();vm.prank(FIRST);vm.expectRevert(TheRecordV2.InvalidAgreement.selector);r.withdraw(id,2,new bytes(4627)); }
    function testCannotWithdrawFinalized() public { finalizeFirst();vm.expectRevert(TheRecordV2.InvalidVersion.selector);r.withdraw(id,1,new bytes(4627)); }
    function testCannotWithdrawFinalizedAmendment() public { pending();flags(2,3);vm.expectRevert(TheRecordV2.InvalidVersion.selector);r.withdraw(id,2,new bytes(4627)); }
    function testMalformedWithdrawalSignatureFails() public { pending();vm.expectRevert(TheRecordV2.InvalidApproval.selector);r.withdraw(id,2,hex'01'); }
    function testCannotWithdrawTwice() public { pending();flags(2,256);vm.expectRevert(TheRecordV2.InvalidVersion.selector);r.withdraw(id,2,new bytes(4627)); }
    function testCannotApproveWithdrawn() public { pending();flags(2,257);vm.expectRevert(TheRecordV2.InvalidVersion.selector);r.approve(id,2,SECOND,new bytes(4627)); }
    function testWithdrawnApprovalDataUnavailable() public { pending();flags(2,256);vm.expectRevert(TheRecordV2.InvalidVersion.selector);r.approvalData(id,2,FIRST); }
    function testCorrectionStartsFreshAndPreservesBothRecords() public {
        pending();flags(2,257);r.amend(id,FIXED);
        (bytes32 first,uint8 m1,bool f1,bool w1)=r.getVersionState(id,1);
        (bytes32 second,uint8 m2,bool f2,bool w2)=r.getVersionState(id,2);
        (bytes32 third,uint8 m3,bool f3,bool w3)=r.getVersionState(id,3);
        require(first==ORIGINAL&&m1==3&&f1&&!w1,'original changed');
        require(second==UPDATE&&m2==1&&!f2&&w2,'withdrawal history lost');
        require(third==FIXED&&m3==0&&!f3&&!w3,'approval carried over');
    }
    function testDelayedWithdrawalCannotTargetOldVersion() public { pending();flags(2,256);r.amend(id,FIXED);vm.expectRevert(TheRecordV2.InvalidVersion.selector);r.withdrawalData(id,2); }
    function testCannotReplacePendingWithoutWithdrawal() public { pending();vm.expectRevert(TheRecordV2.InvalidVersion.selector);r.amend(id,FIXED); }
    function testCannotProposeCurrentFinalizedFileAgain() public { pending();flags(2,256);vm.expectRevert(TheRecordV2.InvalidVersion.selector);r.amend(id,ORIGINAL); }
    function testOutsiderCannotProposeCorrection() public { pending();flags(2,256);vm.prank(SECOND);vm.expectRevert(TheRecordV2.InvalidAgreement.selector);r.amend(id,FIXED); }
    function testWithdrawalDomainDiffersFromApproval() public { pending();require(keccak256(r.withdrawalData(id,2))!=keccak256(r.approvalData(id,2,address(this)))); }
    function testCorrectionApprovalPayloadDiffers() public { pending();bytes memory oldData=r.approvalData(id,2,FIRST);flags(2,256);r.amend(id,FIXED);require(keccak256(oldData)!=keccak256(r.approvalData(id,3,FIRST))); }
    function testChainBindingChangesWithdrawalPayload() public { pending();bytes32 oldHash=keccak256(r.withdrawalData(id,2));vm.chainId(block.chainid+1);require(oldHash!=keccak256(r.withdrawalData(id,2))); }
    function testOriginalContractRemainsIndependent() public { TheRecordV2 another=new TheRecordV2();bytes32 other=another.create(bytes32(uint256(1)),FIRST,SECOND,ORIGINAL);pending();require(keccak256(r.approvalData(id,1,FIRST))!=keccak256(another.approvalData(other,1,FIRST))); }
}
