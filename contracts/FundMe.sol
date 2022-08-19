//Get funds from users
//Withdraw Funds
//Set a Minimum funding value in USD

//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./PriceConverter.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

//859593
//836747
contract FundMe {
    using PriceConvert for uint256;

    uint256 public constant MINIMUM_USD = 20;
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;

    AggregatorV3Interface private s_priceFeed;

    function fund() public payable {
        //want to set minimum usd
        s_funders.push(msg.sender);
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Didnt send enough"
        );
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    address private immutable i_owner;

    constructor(address s_priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(s_priceFeedAddress);
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderindex = 0;
            funderindex < s_funders.length;
            funderindex++
        ) {
            address fundrs = s_funders[funderindex];
            s_addressToAmountFunded[fundrs] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call Failer");
    }

    modifier onlyOwner() {
        require(msg.sender == i_owner, "Sender not Owner");
        _;
    }

    // receive() external payable {
    //     fund();
    // }

    // fallback() external payable {
    //     fund();
    // }
    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call Failer");
    }

    function get_s_funders(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function get_s_addressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    function get_s_priceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }

    function get_i_owner() public view returns (address) {
        return i_owner;
    }
}
