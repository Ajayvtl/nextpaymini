import React, { useState, useEffect } from 'react';
import MetaMaskSDK from '@metamask/sdk';
import Web3 from 'web3';
import { contractAddress, contractABI } from '../../utils/contract';

const MMSDK = new MetaMaskSDK({
    dappMetadata: {
        name: 'MetaMask Payment Dapp',
        url: window.location.href,
    },
    infuraAPIKey: 'ee6298aebe13487b9159bbc78fa00e84', // Optional, only if you're using Infura
    preferExtension: false, // Prefer MetaMask extension when available
});
const PaymentForm = () => {
    const [sender, setSender] = useState('');
    const [receiver] = useState('0x1DF0870DA582e848a680dDf6a847fd9196fac03E'); // Valid Receiver
    const [userid, setUserid] = useState('');
    const [amount, setAmount] = useState('');
    const [transid, setTransid] = useState('');
    const [web3, setWeb3] = useState(null);
    const [time, setTime] = useState('');
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [accounts, setAccounts] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [walletStatus, setWalletStatus] = useState('');
    const [showPayNow, setShowPayNow] = useState(false);
    const [showProgressBar, setShowProgressBar] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const postUrl = 'http://localhost/MBAPI/mbsucess.php'; // Replace with correct endpoint
    const nextUrl = 'http://localhost/MBAPI/mbsucess.php'; // Redirect URL
    // Get URL Parameters
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const userid = urlParams.get('userid');
        const urlAmount = urlParams.get('amount');
        const urlTransid = urlParams.get('transid');
        if (!urlAmount || !urlTransid) {
            alert('❌ Error: Missing required parameters in URL. Please check and try again.');
            window.location.href = nextUrl;
            return; // Prevent further execution
        }
        setUserid(userid || '0');
        setAmount(urlAmount || '0');
        setTransid(urlTransid || 'N/A');
        setTime(new Date().toLocaleString()); // Local time format
        // ✅ Start Timer when page loads and showPayNow is true
        let countdown = 60; // Timer starts with 60 seconds
        setTimeLeft(countdown);

        const timer = setInterval(() => {
            countdown -= 1;
            setTimeLeft(countdown);
            if (countdown <= 0) {
                clearInterval(timer);
                handleTimeout(); // ✅ Handle timeout and send failure response
            }
        }, 1000);

        // Cleanup interval when component unmounts
        return () => clearInterval(timer);
    }, []);
    // ✅ Handle Timeout and Send Failure Response
    const handleTimeout = () => {
        const responseData = {
            userid: userid,
            amount: amount,
            transid: transid,
            datetime: new Date().toISOString(),
            status: 'timeout',
            walletid: sender,
            hash: '',
        };

        alert('⏰ Time expired! Redirecting...');
        sendTransactionData(responseData); // ✅ Send timeout response and redirect
    };

    // Connect Wallet
    // ✅ Connect Wallet Using MetaMask SDK
    const connectWallet = async () => {
        try {
            // Get MetaMask provider using SDK
            const ethereum = MMSDK.getProvider();
            if (!ethereum) {
                setErrorMessage('MetaMask not detected! Please install the MetaMask/Trustwallet extension.');
                return;
            }
            const web3Instance = new Web3(ethereum);
            setWeb3(web3Instance);

            // Request account access
            const accs = await ethereum.request({ method: 'eth_requestAccounts' });
            setAccounts(accs);

            const networkId = await web3Instance.eth.net.getId();
            if (networkId !== 56) {
                alert('Please switch to Binance Smart Chain (BSC).');
                setErrorMessage('❌ Wrong Network! Switch to Binance Smart Chain.');
                return;
            }

            setSender(accs[0]);
            setWalletStatus('✅ Wallet Connected to Binance Smart Chain');
            setShowProgressBar(true); // Show progress bar
            setShowPayNow(true);
            setIsWalletConnected(true); // Hide Connect Wallet Button

        } catch (error) {
            setErrorMessage(`❌ Connection failed: ${error.message}`);
            alert('Connection failed: ' + error.message);
        }
    };
    // ✅ Switch to Binance Smart Chain Automatically
    const switchToBSC = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }], // 0x38 is 56 in hexadecimal (Mainnet)
            });
            setWalletStatus('✅ Switched to Binance Smart Chain');
        } catch (switchError) {
            console.error('❌ Error switching network:', switchError);
            alert('⚠️ Failed to switch network! Please switch manually in your wallet.');
        }
    };

    // ✅ Make Payment
    const makePayment = async () => {
        if (!web3 || !accounts || !amount || !transid) {
            setErrorMessage('❌ Missing transaction details.');
            return;
        }
        // ✅ Double-check network ID before payment
        const networkId = await web3.eth.net.getId();
        if (networkId !== 56) {
            alert('❌ Wrong Network Detected! Please switch to Binance Smart Chain (BSC).');
            setErrorMessage('❌ Wrong Network! Switch to Binance Smart Chain.');
            await switchToBSC();
            return;
        }
        const contract = new web3.eth.Contract(contractABI, contractAddress);
        const amountInWei = web3.utils.toWei(amount, 'ether');

        try {
            setShowProgressBar(true);
            const gas = await contract.methods.transfer(receiver, amountInWei).estimateGas({ from: sender });
            const result = await contract.methods.transfer(receiver, amountInWei).send({ from: sender, gas });
            const readableAmount = web3.utils.fromWei(amount, 'ether');
            // ✅ Success Response
            const responseData = {
                userid: userid, // Replace with actual user ID
                amount: readableAmount,
                transid: transid,
                datetime: new Date().toISOString(),
                status: 'success',
                walletid: sender,
                receiver: receiver,
                hash: result.transactionHash,
            };
            setErrorMessage('Completed' + result.transactionHash);
            alert('Transaction Successful! Hash: ' + result.transactionHash);
            sendTransactionData(responseData); // ✅ Send transaction data and redirect
        } catch (error) {
            setErrorMessage(`❌ Transaction failed: ${error.message}`);
            const responseData = {
                userid: userid,
                amount: web3.utils.fromWei(amountInWei, 'ether'),
                transid: transid,
                datetime: new Date().toISOString(),
                status: 'failed',
                walletid: sender,
                hash: '',
            };
            if (error.message.includes("transfer amount exceeds balance")) {
                setErrorMessage("Error: Insufficient USDT balance.");
                document.getElementById('progressBar').style.display = 'none';
            } else if (error.message.includes("gas required exceeds allowance")) {
                setErrorMessage("Error: Insufficient BNB for gas fees.");
                document.getElementById('progressBar').style.display = 'none';
            } else {
                setErrorMessage("Transaction failed: " + error.message);
                document.getElementById('progressBar').style.display = 'none';
            }
            alert('Transaction failed: ' + error.message);
            sendTransactionData(responseData); // ✅ Send failure data and redirect
        } finally {
            setShowProgressBar(false);
            setShowPayNow(false); // Hide PayNow after transaction
        }
    };
    // ✅ Send Transaction Data to API
    const sendTransactionData = async (responseData) => {
        try {
            await fetch(postUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(responseData),
            });
            console.log('✅ Transaction data saved locally');


            console.log('✅ Transaction data sent successfully');
        } catch (error) {
            console.error('❌ Error sending transaction data:', error);
        } finally {
            window.location.href = nextUrl; // ✅ Redirect to nextUrl after posting data
        }
    };

    // Copy to Clipboard
    const copyToClipboard = () => {
        navigator.clipboard.writeText(receiver);
        alert('✅ Receiver address copied to clipboard!');
    };
    // Timer Logic
    useEffect(() => {
        let timer;
        if (showPayNow && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        alert('⏰ Time expired! Redirecting...');
                        window.location.href = nextUrl; // ✅ Redirect after timeout
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [showPayNow, timeLeft]);

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="payment-cards text-center">
                <h4 className="header-title">
                    Payment <i className="fa-solid fa-shield-halved fsecure-icon"></i>
                </h4>

                <div className="transaction-info">
                    <p>
                        <strong style={{ color: 'white' }}>Transaction ID:</strong>{' '}
                        <span id="ttransid" style={{ color: 'white', float: 'right' }}>
                            {transid}
                        </span>
                    </p>
                    <p>
                        <strong style={{ color: 'white' }}>Payable Amount:</strong>{' '}
                        <span id="payableAmount" style={{ color: 'white', float: 'right' }}>
                            {amount} USDT
                        </span>
                    </p>
                    <p>
                        <strong style={{ color: 'white' }}>Date & Time:</strong>{' '}
                        <span id="dateTime" style={{ color: 'white', float: 'right' }}>
                            {time}
                        </span>
                    </p>
                </div>

                <div className="d-flex justify-content-between align-items-center border-bottom pb-3">
                    <h5 className="header-subtitle d-flex align-items-center gap-2">
                        Payment through BNB USDT <i className="fa-solid fa-coins" style={{ float: 'right' }}></i>
                    </h5>
                    <i className="fa-solid fa-shield-check secure-icon"></i>
                </div>

                <div className="payment-card text-center">
                    {errorMessage && <div className="error-message">{errorMessage}</div>}
                    <form id="paymentForm">
                        <div className="mt-3 text-start">
                            <label htmlFor="sender" className="input-label">Sender Wallet</label>
                            {/* <input type="text" id="sender" value={sender} className="form-control bg-dark text-white" readOnly /> */}
                            <div className="input-group">
                                <span className="input-group-text bg-transparent border-0 text-white"><i
                                    className="fa-solid fa-wallet"></i></span>
                                <input type="text" id="sender" name={sender} className="form-control bg-dark text-white"
                                    readOnly />
                            </div>
                        </div>
                        <div className="mt-3 text-start">
                            <label htmlFor="receiver" className="input-label">XYZ Token</label>
                            {/* <div className="input-group">
                                <input type="text" id="receiver" value={receiver} className="form-control bg-dark text-white" readOnly />
                                <button type="button" onClick={copyToClipboard} className="btn btn-sm btn-outline-light ms-2">
                                    <i className="fa-solid fa-copy"></i>
                                </button>
                            </div> */}

                            <div className="input-group">
                                <span className="input-group-text bg-transparent border-0 text-white"><i
                                    className="fa-solid fa-arrow-right"></i></span>
                                <input type="text" id="receiver" value={receiver} name="receiver" className="form-control bg-dark text-white"
                                    readOnly />
                                <button type="button" onClick={copyToClipboard}
                                    className="btn btn-sm btn-outline-light ms-2"><i className="fa-solid fa-copy"></i></button>
                                <i className="fa-solid fa-check-circle text-success ms-2"></i>
                            </div>

                        </div>
                        <div className="mt-3 text-start">
                            <label htmlFor="amount" className="input-label">USDT Amount</label>
                            {/* <input type="text" id="amount" value={amount} className="form-control bg-dark text-white" readOnly /> */}

                            <div className="input-group">
                                <span className="input-group-text bg-transparent border-0 text-white"><i
                                    className="fa-solid fa-dollar-sign"></i></span>
                                <input type="text" id="amount" name="amount" value={amount} className="form-control bg-dark text-white"
                                    readOnly />
                            </div>


                        </div>
                        {/* ✅ Show Connect Wallet button only if wallet is NOT connected */}
                        {!isWalletConnected && (
                            <button
                                type="button"
                                id="connectWalletBtn"
                                className="btn btn-primary mt-3 w-100"
                                onClick={connectWallet}
                            >
                                <i className="fa-solid fa-wallet"></i> Connect Wallet
                            </button>
                        )}
                        {showProgressBar && (
                            <div id="progressBar" className="progress-bar-container">
                                <div className="progress-bar"></div>
                            </div>
                        )}

                        {timeLeft > 0 && showPayNow && (
                            <div id="timer" style={{ display: 'none' }} className="mt-3 text-warning">
                                Time left: <span id="timeLeft">60</span> seconds
                            </div>
                        )}

                        {walletStatus && <div id="walletStatus" className="mt-2">{walletStatus}</div>}

                        {showPayNow && (
                            <>
                                <button
                                    type="button"
                                    id="payNowBtn"
                                    className="btn btn-buy mt-3"
                                    onClick={makePayment}
                                >
                                    <i className="fa-solid fa-cart-shopping"></i> Pay Now
                                </button>
                                {showProgressBar && (
                                    <div id="progressBar" className="progress-bar-container">
                                        <div className="progress-bar"></div>
                                    </div>
                                )}
                                {timeLeft > 0 && (
                                    <div id="timer" className="mt-3 text-warning">
                                        ⏳ Time left: <span id="timeLeft">{timeLeft}</span> seconds
                                    </div>
                                )}
                            </>
                        )}

                    </form>
                    <p className="secure-payment mt-3">
                        <i className="fa-solid fa-lock secure-icon"></i> 100% Secure Payment
                    </p>
                </div>
                <div className="security-icons">
                    <i className="fa-solid fa-shield"></i>
                    <i className="fa-solid fa-user-shield"></i>
                    <i className="fa-solid fa-fingerprint"></i>
                    <i className="fa-solid fa-check-circle"></i>
                    <i className="fa-solid fa-shield-halved"></i>
                </div>
            </div>
        </div>
    );
};
export default PaymentForm;