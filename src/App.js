import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Web3 from "web3";
import { loadContract } from "./utils/load-contract";

import detectEthereumProvider from "@metamask/detect-provider";

function App() {

  const [web3Api, setWeb3Api] = useState({
    provider:null,
    web3: null,
    contract: null
  })

  const [accounts, setAccount] = useState(null)
  const [balance, setBalance] = useState(null)
  const [reload, setReload] = useState(false)

  const reloadEffect = () =>{
    setReload(!reload)
  }

  const setAccountListner = (provider) =>{
    provider.on("accountsChanged", _ => window.location.reload()) //if i don't give underscore here it will continuously reload
    // provider.on("accountsChanged", (accounts) => setAccount(accounts[0]))
    // provider._jsonRpcConnection.events.on("notificatoin", (payload) =>{
    //   const {method} = payload
    //   if(method === "metamask_unloackStateChanged"){
    //     setAccount(null)
    //   }
    // })
  }

  useEffect(() => {

    const loadProvider = async () =>{
      const provider = await detectEthereumProvider()
      
      if(provider){
        const contract = await loadContract("Faucet", provider)
        setAccountListner(provider)
        // provider.request({method: "eth_requestAccounts"});
        setWeb3Api({
          web3: new Web3(provider),
          provider,
          contract
        })
        
      }
      else{
        console.error("Please install Metamask!!")
      }


      //instead of below written code we used a library above
      // if(window.ethereum){
      //   provider = window.ethereum

      //   try{
      //     await provider.request({method: "eth_requestAccounts"});
      //   } catch{
      //     console.error("User denied accounts access!")
      //   }

      // }
      // else if(window.web3){
      //   provider = window.web3.currentProvider
      // }
      // else if(!process.env.production){
      //   provider = new Web3.providers.HttpProvider("http://localhost:7545")
      // }

      
    }

    loadProvider()

  }, [])

  console.log(web3Api.web3);

  useEffect(() =>{
    const loadBalance = async () =>{
      const {contract, web3} = web3Api
      const balance = await web3.eth.getBalance(contract.address)
      setBalance(web3.utils.fromWei(balance, "ether"))
    }
    
    web3Api.contract && loadBalance()
  } ,[web3Api, reload])

  useEffect(() =>{
    const getAccount = async () =>{
      const accounts = await web3Api.web3.eth.getAccounts()
      setAccount(accounts[0])
    }
    web3Api.web3 && getAccount()
  }, [web3Api.web3])


  const addFunds =useCallback (async () =>{
    const {contract, web3} = web3Api
    await contract.addFunds({
      from: accounts,
      value: web3.utils.toWei("1", "ether")
    })
    reloadEffect()
    // window.location.reload()
  }, [web3Api, accounts])

  const withdraw = async () =>{
    const {contract, web3} = web3Api
    const withdrawAmount = web3.utils.toWei("0.1", "ether")
    await contract.withdraw(withdrawAmount, {
      from: accounts
    })
    reloadEffect()
  }



  return(
    <>
      <div className="faucet-wrapper">
        <div className="faucet">
        <div className="is-flex is-align-item-center">
        <strong className="mr-3">Account: </strong>
          <span>{accounts ? 
            accounts : !web3Api.provider ? <><div className="notification is-warning is-small is-rounded">
            Wallet is not detected!{`  `}
            <a  target="_blank" href="https://docs.metamask.io"> Install Metamask</a>  </div></>:
            <button  className="button is-small"
              onClick={() => web3Api.provider.request({method: "eth_requestAccounts"})}
            >
              Connecet Wallet
            </button>
            }
            </span>
          </div>
          
          <div className="balance-view is-size-2 my-4">
            Current Balance: <strong>{balance} </strong>ETH
          </div>
          
          <button disabled={!accounts} onClick={addFunds} className="button is-primary is-light mr-2">Donate 1 eth</button>
          <button disabled={!accounts} onClick={withdraw} className="button is-link is-light">Withdraw</button>
        </div>
      </div>
    </>
  );
}

export default App;

//npm install --save react-scripts@4.0.3
