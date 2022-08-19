const { inputToConfig } = require("@ethereum-waffle/compiler");
const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");

describe("FundMe", async function () {
  let FundMe;
  let deployer;
  let MockV3Aggregator;
  const sendValue = ethers.utils.parseUnits("1");

  beforeEach(async function () {
    deployer = (await getNamedAccounts()).deployer;
    await deployments.fixture("all");
    fundMe = await ethers.getContract("FundMe", deployer);
    MockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });
  describe("constructor", async function () {
    it("sets the agrrgator adress correctly", async function () {
      const response = await fundMe.get_s_priceFeed();
      assert.equal(response, MockV3Aggregator.address);
    });
  });
  describe("fund", async function () {
    it("fails if not enough eth", async function () {
      await expect(fundMe.fund()).to.be.revertedWith("Didnt send enough");
    });
    it("Updates the amnt funded", async function () {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.get_s_addressToAmountFunded(deployer);
      assert.equal(response.toString(), sendValue.toString());
    });
    it("get_s_funders array should update", async function () {
      await fundMe.fund({ value: sendValue });
      const funder = await fundMe.get_s_funders(0);
      assert.equal(funder.toString(), deployer.toString());
    });
  });
  describe("withdraw", async function () {
    beforeEach(async function () {
      await fundMe.fund({ value: sendValue });
    });
    it("Withdraw Eth from the founder", async function () {
      const startingFundMeBal = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBal = await fundMe.provider.getBalance(deployer);

      //calling
      const txResponse = await fundMe.withdraw();
      const txReceipt = await txResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = txReceipt;
      const gasPrice = gasUsed.mul(effectiveGasPrice);
      const endingFundMeBal = await fundMe.provider.getBalance(fundMe.address);
      const endingDeployerBal = await fundMe.provider.getBalance(deployer);

      //assert
      assert.equal(endingFundMeBal, 0);
      assert.equal(
        startingDeployerBal.add(startingFundMeBal).toString(),
        endingDeployerBal.add(gasPrice).toString()
      );
    });

    it("cheapWithdraw Eth from the founder", async function () {
      const startingFundMeBal = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBal = await fundMe.provider.getBalance(deployer);

      //calling
      const txResponse = await fundMe.cheaperWithdraw();
      const txReceipt = await txResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = txReceipt;
      const gasPrice = gasUsed.mul(effectiveGasPrice);
      const endingFundMeBal = await fundMe.provider.getBalance(fundMe.address);
      const endingDeployerBal = await fundMe.provider.getBalance(deployer);

      //assert
      assert.equal(endingFundMeBal, 0);
      assert.equal(
        startingDeployerBal.add(startingFundMeBal).toString(),
        endingDeployerBal.add(gasPrice).toString()
      );
    });

    it("allows us to withdraw with multiple get_s_funders", async function () {
      const accounts = await ethers.getSigners();
      for (var i = 0; i < 6; i++) {
        const fundMeConnectedAccounts = await fundMe.connect(accounts[i]);
        await fundMeConnectedAccounts.fund({ value: sendValue });
      }
      const startingFundMeBal = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBal = await fundMe.provider.getBalance(deployer);

      const txResponse = await fundMe.withdraw();
      const txReceipt = await txResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = txReceipt;
      const gasPrice = gasUsed.mul(effectiveGasPrice);
      const endingFundMeBal = await fundMe.provider.getBalance(fundMe.address);
      const endingDeployerBal = await fundMe.provider.getBalance(deployer);

      //assert.equal(endingFundMeBal, 0);
      // assert.equal(
      //   startingDeployerBal.add(startingFundMeBal).toString(),
      //   endingDeployerBal.add(gasPrice).toString()
      // );

      await expect(fundMe.get_s_funders(0)).to.be.reverted;

      for (var i = 0; i < 6; i++) {
        assert.equal(
          await fundMe.get_s_addressToAmountFunded(accounts[i].address),
          0
        );
      }
    });

    it("Cheaper Withdraw....", async function () {
      const accounts = await ethers.getSigners();
      for (var i = 0; i < 6; i++) {
        const fundMeConnectedAccounts = await fundMe.connect(accounts[i]);
        await fundMeConnectedAccounts.fund({ value: sendValue });
      }
      const startingFundMeBal = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBal = await fundMe.provider.getBalance(deployer);

      const txResponse = await fundMe.cheaperWithdraw();
      const txReceipt = await txResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = txReceipt;
      const gasPrice = gasUsed.mul(effectiveGasPrice);
      const endingFundMeBal = await fundMe.provider.getBalance(fundMe.address);
      const endingDeployerBal = await fundMe.provider.getBalance(deployer);

      //assert.equal(endingFundMeBal, 0);
      // assert.equal(
      //   startingDeployerBal.add(startingFundMeBal).toString(),
      //   endingDeployerBal.add(gasPrice).toString()
      // );

      await expect(fundMe.get_s_funders(0)).to.be.reverted;

      for (var i = 0; i < 6; i++) {
        assert.equal(
          await fundMe.get_s_addressToAmountFunded(accounts[i].address),
          0
        );
      }
    });

    it("Only Owner to withdraw", async function () {
      const accounts = ethers.getSigners();
      const attacker = accounts[1];
      const attackerConnectedContract = await fundMe.connect(attacker);
      await expect(attackerConnectedContract.withdraw()).to.be.reverted;
    });
  });
});
