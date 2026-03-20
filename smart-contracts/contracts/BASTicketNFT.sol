// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BASTicketNFT is ERC721URIStorage, ERC2981, Ownable {
    uint256 private _nextTokenId;

    // Mapping để khóa vé khi đang đăng bán trên Marketplace nội bộ
    mapping(uint256 => bool) public isLocked;

    // Event
    event TicketMinted(address indexed to, uint256 indexed tokenId, string uri);
    event TicketLocked(uint256 indexed tokenId);
    event TicketUnlocked(uint256 indexed tokenId);

    constructor(address initialOwner) 
        ERC721("BAS Ticket", "BAST") 
        Ownable(initialOwner) 
    {
        // Phí bản quyền mặc định cho Creator là 5% (500 basis points)
        _setDefaultRoyalty(initialOwner, 500); 
    }

    /**
     * @dev Đúc vé NFT mới cho khách hàng. Chỉ Admin/Backend mới được gọi.
     */
    function mintTicket(address to, string memory uri) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        emit TicketMinted(to, tokenId, uri);
        return tokenId;
    }

    /**
     * @dev Khóa vé không cho chuyển nhượng khi đang list trên Marketplace
     */
    function lockTicket(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Ticket does not exist");
        isLocked[tokenId] = true;
        emit TicketLocked(tokenId);
    }

    /**
     * @dev Mở khóa vé
     */
    function unlockTicket(uint256 tokenId) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Ticket does not exist");
        isLocked[tokenId] = false;
        emit TicketUnlocked(tokenId);
    }

    /**
     * @dev Cập nhật lại phí bản quyền
     */
    function setTokenRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) external onlyOwner {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    /**
     * @dev Ghi đè hàm _update của OZ v5.0 để chặn giao dịch nếu vé đang bị khóa
     */
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721) returns (address) {
        address from = _ownerOf(tokenId);
        // Chỉ chặn nếu là giao dịch chuyển nhượng (không phải mint hay burn)
        if (from != address(0) && to != address(0)) {
            require(!isLocked[tokenId], "Ticket is locked for marketplace listing");
        }
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Thu hồi/Hủy vé (khi hệ thống refund hoàn tiền)
     */
    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
    }

    // Các hàm yêu cầu ghi đè do đa kế thừa từ ERC721URIStorage và ERC2981
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
