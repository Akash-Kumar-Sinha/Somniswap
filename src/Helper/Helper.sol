// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

library Helper{
    function sqrt(uint y) internal pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function min(uint x, uint y) internal pure returns (uint z) {
        z = x < y ? x : y;
    }

    function _shortAddr(address a) internal pure returns (string memory) {
        bytes memory full = abi.encodePacked(a);
        bytes memory out = new bytes(4);
        for (uint i = 0; i < 2; i++) {
            bytes1 b = full[i];
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            out[2*i]   = _char(hi);
            out[2*i+1] = _char(lo);
        }
        return string(out);
    }

    function _char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}