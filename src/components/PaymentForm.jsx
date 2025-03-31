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
    const [timeLeft, setTimeLeft] = useState(180);
    const [settest, setTest] = useState(0);
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
    const [retryCountdown, setRetryCountdown] = useState(0);
    // const [mobile, setMobile] = useState(0);
    const postUrl = 'https://webapollo.com/Mitesh/MTB/METAFX/mbsucess.php'; // Replace with correct endpoint
    const nextUrl = 'https://webapollo.com/Mitesh/MTB/METAFX/mbsucess.php'; // Redirect URL
    // Get URL Parameters
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const userid = urlParams.get('userid');
        const urlAmount = urlParams.get('amount');
        const urlTransid = urlParams.get('transid');
        // const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        // setMobile(isMobileDevice ? 1 : 0);
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
        let countdown = 180; // Timer starts with 60 seconds
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
            receiver: receiver,
            hash: '',
        };
        sendTransactionData(responseData); // ✅ Send timeout response and redirect
    };

    // Connect Wallet
    // ✅ Connect Wallet Using MetaMask SDK
    const connectWallet = async () => {
        const test = 0;
        setTest(test);

        try {
            console.log('📡 Trying to connect wallet...');
            // Get MetaMask provider using SDK
            const ethereum = MMSDK.getProvider();
            if (!ethereum) {
                console.error('❌ MetaMask not detected!');
                setErrorMessage('MetaMask not detected! Please install the MetaMask/Trustwallet extension.');
                return;
            }
            console.log('✅ MetaMask detected:', ethereum);
            const web3Instance = new Web3(ethereum, null, { transactionBlockTimeout: 0 });
            setWeb3(web3Instance);
            console.log('✅ Web3 instance created:', web3Instance);
            // Request account access
            // console.log('✅ Web3 instance created:', web3Instance);
            console.log('🔑 Requesting account access...');
            const accs = await ethereum.request({ method: 'eth_requestAccounts' });
            console.error('retrieved from MetaMask.', accs);
            if (!accs || accs.length === 0) {
                console.error('❌ No accounts retrieved from MetaMask.');
                setErrorMessage('❌ No accounts found. Please unlock MetaMask.');
                return;
            } else {
                // ✅ Account found - Set accounts and sender properly
                console.log('🎉 Accounts retrieved:', accs);
                setAccounts(accs);
                setSender(accs[0]); // Set first account
                console.log('🎉 Sender address:', accs[0]);
                console.log('🔗 Accounts:', accs);
                setErrorMessage(''); // Clear any previous errors
                setShowPayNow(true); // Show Pay Now button if connected successfully
            }
            // if (accs.length === 0) {
            //     setErrorMessage('❌ No accounts found.');
            //     return;
            // }
            const networkId = await web3Instance.eth.net.getId();
            if (test == 1) {
                if (networkId !== 97) {
                    alert('Please switch to Binance Smart Chain (BSC).');
                    console.log('🌐 Network ID:', networkId);
                    console.log('❌ Incorrect network:', networkId);
                    setErrorMessage('❌ Wrong Network! Switch to test Binance Smart Chain.');
                    return;
                }
            } else {
                if (networkId !== 56) {
                    alert('Please switch to Binance Smart Chain (BSC).');
                    console.log('🌐 Network ID:', networkId);
                    console.log('❌ Incorrect network:', networkId);
                    setErrorMessage('❌ Wrong Network! Switch to Binance Smart Chain.');
                    return;
                }
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
    const switchTotBSC = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x61' }], // ✅ 0x61 is 97 in hexadecimal (BSC Testnet)
            });
            setWalletStatus('✅ Switched to Binance Smart Chain Testnet');
        } catch (switchError) {
            // If the chain is not added, add it manually
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                                chainId: '0x61', // ✅ BNB Testnet chain ID in hex (97)
                                chainName: 'Binance Smart Chain Testnet',
                                nativeCurrency: {
                                    name: 'BNB',
                                    symbol: 'BNB',
                                    decimals: 18,
                                },
                                rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'], // ✅ Public RPC URL
                                blockExplorerUrls: ['https://testnet.bscscan.com/'],
                            },
                        ],
                    });
                    setWalletStatus('✅ Switched to Binance Smart Chain Testnet');
                } catch (addError) {
                    console.error('❌ Failed to add BSC Testnet:', addError);
                    alert('⚠️ Failed to add BSC Testnet! Please add it manually.');
                }
            } else {
                console.error('❌ Error switching network:', switchError);
                alert('⚠️ Failed to switch network! Please switch manually in your wallet.');
            }
        }
    };
    // ✅ Function to Retry Make Payment with Delay
    // ✅ Function to Fetch Gas Limit with Retry
    const fetchGasLimitWithRetry = async (contract, sender, receiver, amountInWei, retries = 3, delay = 5000) => {
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`🔁 Attempt ${i + 1} to estimate gas limit...`);
                const gasLimit = await contract.methods
                    .transfer(receiver, amountInWei)
                    .estimateGas({ from: sender });
                console.log('✅ Gas Limit fetched successfully:', gasLimit);
                return gasLimit; // Return if successful
            } catch (error) {
                console.error(`❌ Error estimating gas on attempt ${i + 1}:`, error.message);

                if (i < retries - 1) {
                    console.log(`⏳ Retrying to get gas limit in ${delay / 1000} seconds...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                } else {
                    throw new Error('❌ Failed to fetch gas limit after multiple attempts.');
                }
            }
        }
    };
    // ✅ Function to Fetch Gas Price with Retry and Timeout
    const fetchGasPriceWithRetry = async (retries = 3, delay = 5000) => {
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`🔁 Attempt ${i + 1} to get gas price...`);

                // Use Promise.race to set a timeout for 5 seconds to avoid hanging
                const gasPrice = await Promise.race([
                    web3.eth.getGasPrice(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('⏱️ Timeout getting gas price after 5 seconds')), 5000)
                    ),
                ]);

                if (gasPrice) {
                    console.log('✅ Gas Price fetched successfully:', gasPrice);
                    return gasPrice;
                }
            } catch (error) {
                console.error(`❌ Error fetching gas price on attempt ${i + 1}:`, error.message);

                if (i < retries - 1) {
                    console.log(`⏳ Retrying to get gas price in ${delay / 1000} seconds...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                } else {
                    throw new Error('❌ Failed to fetch gas price after multiple attempts.');
                }
            }
        }
    };

    // ✅ Make Payment
    const makePayment = async () => {
        setIsWalletConnected(true);
        let paymentTimeout = null;
        let countdown = 40;
        setRetryCountdown(countdown);
        if (!web3 || !accounts || !amount || !transid) {
            setErrorMessage('❌ Missing transaction details.');
            return;
        }
        setIsPaymentProcessing(true);

        // ✅ Start a timeout to re-enable the button if no response after 20 seconds
        paymentTimeout = setInterval(() => {
            countdown -= 1;
            setRetryCountdown(countdown);

            if (countdown <= 0) {

                console.warn('⏳ Transaction taking longer than 20 seconds. Re-enabling Pay Now button.');
                clearInterval(paymentTimeout);
                setIsPaymentProcessing(false); // Re-enable the button
                setRetryCountdown(0); // Reset countdown to 0
            }
        }, 1000);  // 20 seconds timeout
        // ✅ Double-check network ID before payment
        const networkId = await web3.eth.net.getId();
        if (settest == 1) {
            if (networkId !== 97) {
                alert('❌ Wrong Network Detected! Please switch to Binance Smart Chain (BSC).');
                setErrorMessage('❌ Wrong Network! Switch to Binance Smart Chain.');
                await switchTotBSC();
                return;
            }

        } else {
            if (networkId !== 56) {
                alert('❌ Wrong Network Detected! Please switch to Binance Smart Chain (BSC).');
                setErrorMessage('❌ Wrong Network! Switch to Binance Smart Chain.');
                await switchToBSC();
                return;
            }
        }
        if (settest == 1) {
            setShowProgressBar(true);
            try {
                // Check if Web3 instance is available
                if (!web3) {
                    alert('⚠️ Web3 not initialized. Please connect to MetaMask.');
                    return;
                }

                const accounts = await web3.eth.getAccounts(); // Get connected accounts
                if (!accounts || accounts.length === 0) {
                    alert('❌ No account connected. Please connect MetaMask.');
                    return;
                }

                const senderAddress = accounts[0]; // First connected account
                const receiverAddress = '0x027A620bBc880BfdAc9aE2C11617EC43CDcb7792'; // Replace with receiver's address
                const amountToSend = amount; // Amount in BNB (e.g., 0.01 BNB)
                // const readableAmount = web3.utils.fromWei(amount, 'ether');
                console.log('🔗 Preparing transaction...');
                const tx = await web3.eth.sendTransaction({
                    from: senderAddress,
                    to: receiverAddress,
                    value: web3.utils.toWei(amountToSend, 'ether'), // Convert BNB to Wei
                    gas: 21000, // Gas limit for sending BNB
                });
                const responseData = {
                    userid: userid, // Replace with actual user ID
                    amount: web3.utils.toWei(amountToSend, 'ether'),
                    transid: transid,
                    datetime: new Date().toISOString(),
                    status: 'success',
                    walletid: sender,
                    receiver: receiverAddress,
                    hash: tx.transactionHash,
                };
                sendTransactionData(responseData);
                console.log(`✅ Transaction successful! Hash: ${tx.transactionHash}`);
                alert(`✅ Transaction successful! Hash: ${tx.transactionHash}`);

                // ✅ Clear timeout if transaction succeeds
                if (paymentTimeout) {
                    clearTimeout(paymentTimeout);
                }
            } catch (error) {
                const receiverAddress = '0x027A620bBc880BfdAc9aE2C11617EC43CDcb7792'; // Replace with receiver's address
                const responseData = {
                    userid: userid, // Replace with actual user ID
                    amount: amount,
                    transid: transid,
                    datetime: new Date().toISOString(),
                    status: 'success',
                    walletid: sender,
                    receiver: receiverAddress,
                    hash: '',
                };
                sendTransactionData(responseData);
                console.error('❌ Transaction failed:', error.message);
                alert(`❌ Transaction failed: ${error.message}`);
            }
        } else {
            let gasLimit;
            try {
                setShowProgressBar(true);
                console.log('🔗 Preparing transaction...From USDT');
                const contract = new web3.eth.Contract(contractABI, contractAddress);
                // const usdtToWei = (amount, decimals = 18) => {
                //     return web3.utils.toBN((parseFloat(amount) * Math.pow(10, decimals)).toFixed(0));
                // };
                const amountInWei = web3.utils.toWei(amount, 'ether'); // For USDT, decimals = 18
                console.log('🔗 Preparing transaction...Contract Amout to send in new wei', amountInWei.toString());
                console.log('🔗 Preparing transaction...Contract Amout to send in wei', amount);
                console.log('🔗 Preparing reciver :', receiver);
                console.log('🔗 Preparing to sender:', sender);
                // const gas = await contract.methods.transfer(receiver, amountInWei).estimateGas({ from: sender });
                // ✅ Fetch Gas Limit with Retry
                try {
                    gasLimit = await fetchGasLimitWithRetry(contract, sender, receiver, amountInWei, 3, 10000);
                    console.log('✅ Estimated Gas Limit:', gasLimit);
                } catch (error) {
                    console.error('❌ Error fetching gas limit after retries:', error.message);
                    setErrorMessage('❌ Error estimating gas limit after multiple attempts.');
                    throw error; // Rethrow error to trigger retry in makePayment
                } console.log('🔗 Estimated Gas Limit:', gasLimit);

                // ✅ 2. Get Gas Price (Optional but Recommended)
                let gasPrice;
                try {
                    gasPrice = await web3.eth.getGasPrice();
                    console.log('🔗 Gas Price:', gasPrice);
                } catch (gasPriceError) {
                    console.warn('⚠️  Error getting gas price, using default:', gasPriceError);
                    gasPrice = web3.utils.toWei('5', 'gwei'); // Default to 5 gwei (adjust if needed)
                }
                try {
                    gasPrice = await fetchGasPriceWithRetry(3, 5000);
                    console.log('✅ Gas Price after retries:', gasPrice);
                } catch (gasPriceError) {
                    console.error('❌ Failed to fetch gas price after retries:', gasPriceError);
                    setErrorMessage('❌ Error fetching gas price after multiple attempts. Using default gas price.');
                    gasPrice = web3.utils.toWei('5', 'gwei'); // Default fallback gas price
                }
                const result = await contract.methods.transfer(receiver, amountInWei).send({ from: sender, gas: gasLimit, gasPrice: gasPrice });
                console.log('🔗 Preparing transaction...Contract Result', result);
                const amountToSend = amount; // Amount in BNB (e.g., 0.01 BNB)
                // ✅ Success Response
                const responseData = {
                    userid: userid, // Replace with actual user ID
                    amount: web3.utils.toWei(amountToSend, 'ether'),
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

                // ✅ Clear timeout if transaction succeeds
                if (paymentTimeout) {
                    clearTimeout(paymentTimeout);
                }
            } catch (error) {
                const usdtToWei = (amount, decimals = 18) => {
                    return web3.utils.toBN((parseFloat(amount) * Math.pow(10, decimals)).toFixed(0));
                };
                const amountInWei = usdtToWei(amount, 18); // For USDT, decimals = 18
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
                                <input type="text" id="sender" name={sender} value={sender} className="form-control bg-dark text-white"
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
                                Time left: <span id="timeLeft">120</span> seconds
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
                                    disabled={isPaymentProcessing} // ✅ Disable button while processing
                                >
                                    {isPaymentProcessing ? (
                                        retryCountdown > 0 ? (
                                            <>
                                                <i className="fa-solid fa-spinner fa-spin"></i> Retry after {retryCountdown} seconds...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-spinner fa-spin"></i> Processing...
                                            </>
                                        )
                                    ) : (
                                        <>
                                            <i className="fa-solid fa-cart-shopping"></i> Pay Now
                                        </>
                                    )}
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
