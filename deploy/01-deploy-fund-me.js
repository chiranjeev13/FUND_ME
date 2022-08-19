const { verifyMessage } = require("ethers/lib/utils");
const { network } = require("hardhat");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

const chainId = network.config.chainId;
const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  let ethUsdPriceFeedAddress;
  if (developmentChains.includes(network.name)) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
    log("*****");
    console.log(ethUsdPriceFeedAddress);
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed;
    console.log(ethUsdPriceFeedAddress);
  }
  const args = [ethUsdPriceFeedAddress];

  const FundMe = await deploy("FundMe", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(FundMe.address, args);
  }
  log("------------------------------");
};
module.exports.tags = ["all", "fundme"];
