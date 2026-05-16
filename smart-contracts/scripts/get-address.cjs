const { ethers } = require("ethers");
const privateKey = "25d4aeed1aa1f21c3bd8a600c63a42c9fa6aedb70bacc9786473c6aa7a6910d3";
const wallet = new ethers.Wallet(privateKey);
console.log(wallet.address);
