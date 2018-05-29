# Ethereum-IPFS-React App

Before you run the project, you will need an instance of the Etheruem blockchain running, as well as MetaMask which is used to interact with the blockchain from your browser.

## Downloads
* [Ganache](http://truffleframework.com/ganache/) - For the blockchain
* [MetaMask](https://metamask.io/) - To interact with the blockchain via browser

## Getting Started
### Prerequisites
#### New Directory
Create a new directory and download the Git files into there. Then run:
```
npm i create-react-app
npm install react-bootstrap
npm install fs-extra
npm install ipfs-api
npm install web3@^1.0.0-beta.26
npm install crypto
npm install js-file-download
```
#### Deploying Contract
Once Ganache is open and running, deploy the smart contract via [Remix](https://remix.ethereum.org/) by pasting the following code and then deploying.

```
pragma solidity ^0.4.20;

contract SimpleStorage {
    address public _creator;
    address public _owner;

    //Hash of data to IPFS address
    string storedHash;

    struct Permission {
      bool exists;
      bool read;
      bool write;
    }

    mapping(address => Permission) _permissions;

    modifier onlyCreator {
      require(msg.sender == _creator);
      _;
    }

    modifier onlyOwner {
      require(msg.sender == _owner);
      _;
    }

    modifier onlyReadPermission {
      require (_permissions[msg.sender].read == true);
      _;
    }

    constructor() public {
      _creator = msg.sender;
      _owner = msg.sender;

      _permissions[_owner] = Permission({
        exists: true,
        read: true,
        write: true
        });
    }

    function sethash (string x) public {
        storedHash = x;
    }

    function grantOwnership (address account) public onlyOwner {
      _owner = account;
    }

    function grantRead (address account) public onlyOwner {
      _permissions[account] = Permission({
        exists: true,
        read: true,
        write: false
        });
    }

    function revokeRead (address account) public onlyOwner {
      _permissions[account] = Permission({
        exists: true,
        read: false,
        write: false
        });
    }

    /*~~~~~~~~~~~~~~~~~Getters~~~~~~~~~~~~~~~~~*/

    function hasRead (address account) public view returns (bool) {
      if(_permissions[account].read) {
        return true;
      }
      return false;
    }

    function isOwner () public view returns(address x){
      return _owner;
    }

    function getHash() public view onlyReadPermission returns (string x) {
      return storedHash;
    }

    function isMsgSender() public view returns (address x){
        return msg.sender;
    }
}
```
Go to the "Run" tab in Remix, and copy the address at which the contract has been deployed.

In the "src" folder, open the storehash.js file and replace the address with the one from Remix.

Do the same for the abi which can be obtained in Remix by going to the "compile" tab and clicking "Details".

#### MetaMask
Now, in your browser ensure that MetaMask is connected to the right network.

#### Running the App
Enter the directory containing the files downloaded from Git, then type:

```
npm start
```
and the App should be render on http://localhost:3000/.

## License
MIT
