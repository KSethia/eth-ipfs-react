import React, { Component } from 'react';
//import logo from ‘./logo.svg’;
import './App.css';
import web3 from './web3';
import ipfs from './ipfs';
//import cryptoJS from './crypto-js';
import crypto from './crypto';
import fileDownload from './js-file-download';
import storehash from './storehash';
class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      ipfsHash:null,
      buffer:'',
      encBuffer:'',
      encData:'',
      decData:'',
      permission:'',
      accAddr:"", //Used for input forms, grantRead revokeRead
      msgSender:"",
      ethAddress:'',
      blockNumber:'',
      transactionHash:'',
      gasUsed:'',
      txReceipt: ''
    };
    //this.updateInputVal = this.updateInputVal.bind(this);
    this.handleChange1 = this.handleChange1.bind(this);
    this.handleChange2 = this.handleChange2.bind(this);
  }



captureFile =(event) => {
        event.stopPropagation()
        event.preventDefault()
        const file = event.target.files[0]
        let reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
        reader.onloadend = () => this.convertToBuffer(reader)
        //this.convertToBuffer(this.state.encText)
      };

convertToBuffer = async(reader) => {
      //file is converted to a buffer for upload to IPFS
        const buffer = await Buffer.from(reader.result);
      //set this buffer -using es6 syntax
        this.setState({buffer});
    };
onClick = async () => {
try{
        const accounts = await web3.eth.getAccounts();

        this.setState({blockNumber:"waiting.."});
        this.setState({gasUsed:"waiting..."});
        //this.msgSender();
        /*
        await storehash.methods.isOwner().call((err, transactionHash)=>{
          console.log(err, transactionHash);
          this.setState({transactionHash});
        });
        await web3.eth.getTransaction(this.state.transactionHash, (err,tx)=>{
          console.log(err, tx);
          console.log(err, tx.from);
          this.setState({msgSender: tx.from});
        }); */
//get Transaction Receipt in console on click
//See: https://web3js.readthedocs.io/en/1.0/web3-eth.html#gettransactionreceipt
        await web3.eth.getTransactionReceipt(this.state.transactionHash, (err, txReceipt)=>{
          console.log(err,txReceipt);
          this.setState({txReceipt});
        }); //await for getTransactionReceipt
        await this.setState({blockNumber: this.state.txReceipt.blockNumber});
        await this.setState({gasUsed: this.state.txReceipt.gasUsed});
        //Read Permission
        /*await web3.eth.getTransaction(this.state.transactionHash, (err, tx)=>{
          console.log(err, tx);
          this.setState({msgSender: tx.from});
        });
        console.log(this.state.msgSender);*/
        /*await storehash.methods.isMsgSender().call((err, result)=>{
          console.log(result);
          this.setState({msgSender: result})
        });*/
        storehash.methods.hasRead(accounts[0]).call((err, result) => {
          console.log(result);
          this.setState({permission: result});
        });
      } //try
    catch(error){
        console.log(error);
      } //catch
  } //onClick
onReadAccess = async (event) => {
  const accounts = await web3.eth.getAccounts();
  console.log(accounts[0]);
  await storehash.methods.hasRead(accounts[0]).call((err, result) => {
    console.log(err, result);
    this.setState({permission: result});
  });
} //onReadAccess
onSubmit = async (event) => {
      event.preventDefault();
     //bring in user's metamask account address
      const accounts = await web3.eth.getAccounts();
      //obtain contract address from storehash.js
        const ethAddress = await storehash.options.address;
        this.setState({ethAddress});
      /*//call a method in storehash(contract) in order to getTransaction
      storehash.methods.isOwner().call((err, transactionHash)=>{
        console.log(err, transactionHash);
        this.setState({transactionHash});
      });
      web3.eth.getTransaction(this.state.transactionHash, (err,tx)=>{
        console.log(err, tx.from);
        this.setState({msgSender: tx.from});
      });
      */
      console.log('Sending from Metamask account: ' + accounts[0]);
    //encrypt array buffer with AES
      const algorithm = 'aes-256-ctr';
      const key = 'test';
      var cipher = crypto.createCipher(algorithm, key);
      var encBuffer = Buffer.concat([cipher.update(this.state.buffer),cipher.final()]);
      this.setState({encBuffer});
    //save document to IPFS,return its hash#, and set hash# to state
    //https://github.com/ipfs/interface-ipfs-core/blob/master/SPEC/FILES.md#add
      await ipfs.files.add(this.state.encBuffer, (err, ipfsHash) => {
        console.log(err,ipfsHash);
        //setState by setting ipfsHash to ipfsHash[0].hash
        this.setState({ ipfsHash:ipfsHash[0].hash });
   // call Ethereum contract method "sendHash" and .send IPFS hash to etheruem contract
  //return the transaction hash from the ethereum contract
 //see, this https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#methods-mymethod-send

        storehash.methods.sethash(this.state.ipfsHash).send({
          from: accounts[0]
        }, (error, transactionHash) => {
          console.log(transactionHash);
          this.setState({transactionHash});
        }); //storehash
      }) //await ipfs.add
    }; //onSubmit

onDecrypt = async (event) => {
  event.preventDefault();
  const accounts = await web3.eth.getAccounts();
  const ethAddress = await storehash.options.address;
  this.setState({ethAddress});

  storehash.methods.hasRead(accounts[0]).call((err, result) => {
    console.log("9");
    console.log(result);
    this.setState({permission: result});
    if(this.state.permission === false) {
      console.log("You are not permitted to view this document.");
      alert("You are not permitted to view this document.");
    }
  });
  if(this.state.permission){
    //get hash from contract
    storehash.methods.getHash().call( (err, result) => {
      console.log(result);
      this.setState({ipfsHash: result[0].hash});
    }); //storehash, getHash()
    //get encrypted data from IPFS
    ipfs.files.cat(this.state.ipfsHash, (err, encData) => {
      console.log(err, encData);
      this.setState({encData});
      this.decipher(this.state.encData);
    }); //ipfs cat
  } //if continue
}; //decrypt

decipher (encData) {
  const algorithm = 'aes-256-ctr';
  const key = 'test';
  var decipher = crypto.createDecipher(algorithm, key);
  var decData = Buffer.concat([decipher.update(encData) , decipher.final()]);
  this.setState({decData});
  console.log(decData.toString('utf8'));
  fileDownload(this.state.decData, "hello-o.txt");
}

/*grantR = async(accAddr) => {
  storehash.methods.grantRead(accAddr).send({from: "0xc9FD87a52Cd94E29b6Ba434036ddAA66c0Eaf5e8"}, (err,transactionHash)=>{
    console.log(transactionHash);
    this.setState({transactionHash});
  });
  alert(accAddr + " has been given read access.");
  storehash.methods.hasRead(accAddr).call((err, result)=>{
    console.log(err, result);
    this.setState({permission: result});
  }); //hasRead update
}*/

grantRead = async (accAddr) => {
  const accounts = web3.eth.getAccounts();
  await storehash.methods.hasRead(accAddr).call((err, result) => {
    console.log(result);
    this.setState({permission: result});
    if(this.state.permission) {
      alert("This address already has permission.");
    } else {
      //this.grantR(accAddr);
      storehash.methods.grantRead(accAddr).send({from: "0xc9FD87a52Cd94E29b6Ba434036ddAA66c0Eaf5e8"}, (err,transactionHash)=>{
        console.log(transactionHash);
        this.setState({transactionHash});
        //this.setState({permission: !this.state.permission});
        //console.log(this.state.permission);
        storehash.methods.hasRead(accounts[0]).call((err, result) => {
          console.log(result);
          this.setState({permission: result});
        });
      });
      alert(accAddr.toString() + " has been given read access.");
    } // if else state.permission
  }); //hasRead
}

grantReadSubmit = async (event) => {
  event.preventDefault();
  //const accounts = await web3.eth.getAccounts();
  //testing
  //console.log(accounts[]);
  /*if(accounts.indexOf(this.state.accAddr) >= 0){
    this.grantRead(this.state.accAddr);
  } else {
    alert("That is not a valid address within the network.");
  }*/
  this.grantRead(this.state.accAddr);
  //this.grantRead();
}

revokeRead = async () => {
  const accounts = web3.eth.getAccounts();
  await storehash.methods.hasRead(this.state.accAddr).call((err, result) => {
    console.log(result);
    this.setState({permission: result});
    if(this.state.permission){
      storehash.methods.revokeRead(this.state.accAddr).send({from: "0xc9FD87a52Cd94E29b6Ba434036ddAA66c0Eaf5e8"}, (err,transactionHash)=>{
        console.log(transactionHash);
        this.setState({transactionHash});
        //this.setState({permission: !this.state.permission});
        //console.log(this.state.permission);
        storehash.methods.hasRead(this.state.accAddr).call((err, result) => {
          console.log(result);
          this.setState({permission: result});
        });
      }); //revokeRead
      alert(this.state.accAddr.toString() + " has been revoked read access.");
    } else {
      alert("This address doesn't have permission anyway.")
    } //if state.permission
  }); //hasRead
}
revokeReadSubmit = async (event) => {
  event.preventDefault();
  //this.revokeRead(this.state.accAddr);
  this.revokeRead();
}

/*updateInputVal(event) {
  //const target = event.target;
  this.setState({accAddr: evt.target.value});
}*/
/*updateInputVal(evt) {
  this.setState({[evt.target.accAddr]: evt.target.value});
}*/
handleChange1(event) {
  this.setState({accAddr: event.target.value});
}
handleChange2(event) {
  this.setState({accAddr: event.target.value});
}

render() {

      return (
        <div className="App">
          <header className="App-header">
            <h1> Ethereum and IPFS with Create React App</h1>
          </header>

          <hr />
<grid>
          <h3> Choose file to send to IPFS </h3>
          <form onSubmit={this.onSubmit}>
            <input
              type = "file"
              onChange = {this.captureFile}
            />
             <button
             bsstyle="primary"
             type="submit">
             Send it
             </button>
          </form>
          <h3> Decrypt data </h3>
          <button onClick = {this.onDecrypt}>Decrypt</button>
<hr/>
 <button onClick = {this.onClick}> Get Transaction Receipt </button>
 <button onClick = {this.onReadAccess}> Check Read Access </button>
  <table bordered responsive>
                <thead>
                  <tr>
                    <th>Tx Receipt Category</th>
                    <th>Values</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>IPFS Hash # stored on Eth Contract</td>
                    <td>{this.state.ipfsHash}</td>
                  </tr>
                  <tr>
                    <td>IPFS gateway</td>
                    <a target="_blank" href={"https://gateway.ipfs.io/ipfs/" + this.state.ipfsHash}>Gateway</a>
                  </tr>
                  <tr>
                    <td>Ethereum Contract Address</td>
                    <td>{this.state.ethAddress}</td>
                  </tr>
                  <tr>
                    <td>Tx Hash # </td>
                    <td>{this.state.transactionHash}</td>
                  </tr>
                  <tr>
                    <td>Block Number # </td>
                    <td>{this.state.blockNumber}</td>
                  </tr>
                  <tr>
                    <td>Gas Used</td>
                    <td>{this.state.gasUsed}</td>
                  </tr>
                  <tr>
                    <td>Read Access</td>
                    <td>{this.state.permission.toString()}</td>
                  </tr>
                  <tr>
                    <td>Grant Read Access</td>
                    <form onSubmit={this.grantReadSubmit}>
                      <label>
                        Address:
                        <input type="text1" value={this.state.accAddr} onChange={this.handleChange1}/>
                      </label>
                      <input type="submit" value="Submit" />
                    </form>
                  </tr>
                  <tr>
                    <td>Revoke Read Access</td>
                    <form onSubmit={this.revokeReadSubmit}>
                      <label>
                        Address:
                        <input type="text2" value={this.state.accAddr} onChange={this.handleChange2}/>
                      </label>
                      <input type="submit" value="Submit" />
                    </form>
                  </tr>

                </tbody>
            </table>
        </grid>
     </div>
      );
    } //render
} //App
export default App;
