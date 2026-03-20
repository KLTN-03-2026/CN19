import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Đang deploy bằng account (Platform Admin):", deployer.address);

  // Khởi tạo Smart Contract BASTicketNFT (tương thích ERC-721 và OpenZeppelin v5.0)
  const BASTicket = await hre.ethers.getContractFactory("BASTicketNFT");
  
  console.log("Đang chờ xác nhận giao dịch...");
  
  // Tham số constructor là mảng, ở đây initialOwner = deployer.address
  const ticketNFT = await BASTicket.deploy(deployer.address);
  await ticketNFT.waitForDeployment();

  console.log("✅ BAS Ticket Smart Contract đã được deploy thành công!");
  console.log("Contract Address:", await ticketNFT.getAddress());
  
  console.log("Hành động tiếp theo: Copy địa chỉ này dán vào biến môi trường Backend: `SMART_CONTRACT_ADDRESS`");
}

main().catch((error) => {
  console.error("Lỗi deploy:", error);
  process.exitCode = 1;
});
