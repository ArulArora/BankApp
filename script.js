'use strict';

//////////////////
// BANKIST APP //
/////////////////

//DATA/////////////////////////
const account1 = {
  owner: 'Jonas Schmedtmann',
  movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  interestRate: 1.2, // %
  pin: 2222,

  movementsDates: [
    '2019-11-18T21:31:17.178Z',
    '2019-12-23T07:42:02.383Z',
    '2020-01-28T09:15:04.904Z',
    '2020-04-01T10:17:24.185Z',
    '2020-05-08T14:11:59.604Z',
    '2020-05-27T17:01:17.194Z',
    '2021-12-09T23:36:17.929Z',
    '2021-12-12T10:51:36.790Z',
  ],
  currency: 'EUR',
  locale: 'pt-PT', // de-DE
};

const account2 = {
  owner: 'Arul Arora',
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 1111,

  movementsDates: [
    '2019-11-01T13:15:33.035Z',
    '2019-11-30T09:48:16.867Z',
    '2019-12-25T06:04:23.907Z',
    '2020-01-25T14:18:46.235Z',
    '2020-02-05T16:33:06.386Z',
    '2020-04-10T14:43:26.374Z',
    '2020-06-25T18:49:59.371Z',
    '2020-07-26T12:01:20.894Z',
  ],
  currency: 'USD',
  locale: 'en-US',
};

const accounts = [account1, account2]; //array of accounts in the bank

//ELEMENTS//////////////////////////
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

//EVENT HANDLERS//////////////////////
let currentAccount, timer;

//login to the account
btnLogin.addEventListener('click', function (e) {
  e.preventDefault(); //prevent form from submitting - no reload. e is the event

  currentAccount = accounts.find(acc => acc.username === inputLoginUsername.value); //get the current account
  if (currentAccount?.pin === Number(inputLoginPin.value)) { //only checks if currentAccount exists
    //Display UI and welcome message
    labelWelcome.textContent = `Welcome back ${currentAccount.owner.split(' ')[0]}`;
    containerApp.style.opacity = 100;

    //Update login date based on user's country 
    const now = new Date();
    const options = {
      hour: 'numeric',
      minute: 'numeric',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }
    labelDate.textContent = new Intl.DateTimeFormat(currentAccount.locale, options).format(now); //format date based on account country using Intl API

    //Clear form fields
    inputLoginUsername.value = inputLoginPin.value = '';
    inputLoginPin.blur();

    if (timer) clearInterval(timer); //stop any timer if there is one
    timer = startLogOutTimer(); //set the timer

    //Calculate + display summary, balance and movements
    updateUI(currentAccount);
  }
});

//Transfering money to another account
btnTransfer.addEventListener('click', function (e) {
  e.preventDefault();
  const amount = Number(inputTransferAmount.value);
  const receiverAcc = accounts.find(acc => acc.username === inputTransferTo.value); //find account with the username

  if (amount > 0 && receiverAcc && currentAccount.balance >= amount && receiverAcc.username !== currentAccount.username) {
    //Doing the transfer
    currentAccount.movements.push(-amount);
    receiverAcc.movements.push(amount);

    //Add transfer dates
    currentAccount.movementsDates.push(new Date());
    receiverAcc.movementsDates.push(new Date());

    clearInterval(timer); //stop timer
    timer = startLogOutTimer(); //set new timer

    //Update UI
    updateUI(currentAccount);
  }

  inputTransferAmount.value = inputTransferTo.value = ''; //clear the fields on the form
});

//Closing an account
btnClose.addEventListener('click', function (e) {
  e.preventDefault();

  if (currentAccount.username === inputCloseUsername.value && currentAccount.pin === Number(inputClosePin.value)) {
    const index = accounts.findIndex(acc => acc.username === currentAccount.username);
    accounts.splice(index, 1); //deletes the current account from the accounts array

    containerApp.style.opacity = 0; //hide UI
    labelWelcome.textContent = 'Log in to get started'; //Change the starting screen label
  }

  inputCloseUsername.value = inputClosePin.value = ''; //clear the fields on the form
});

//Requesting a loan
btnLoan.addEventListener('click', function (e) {
  e.preventDefault();

  const amount = Math.floor(inputLoanAmount.value); //round down -> no decimal places

  //has to have one deposit that is 10 percent the amount of the loan
  if (amount > 0 && currentAccount.movements.some(mov => mov >= amount * 0.1)) {
    setTimeout(function () { //loan is approved after 3 seconds
      currentAccount.movements.push(amount); //add loan as movement
      currentAccount.movementsDates.push(new Date()); //Add loan date

      clearInterval(timer); //stop timer
      timer = startLogOutTimer(); //set new timer

      updateUI(currentAccount); //update UI
    }, 3000);
  }

  inputLoanAmount.value = ''; //clear the field
});

//sort the movements ascendingly
let sorted = false;

btnSort.addEventListener('click', function (e) {
  e.preventDefault();
  displayMovements(currentAccount, !sorted);
  sorted = !sorted;
});

//FUNCTIONS////////////////////
const startLogOutTimer = function () {
  //set time to 5mins
  let time = 300; //in seconds

  const tick = function () {
    const min = String(Math.trunc(time / 60)).padStart(2, 0);
    const sec = String(time % 60).padStart(2, 0);

    //in call back print remaining time to UI
    labelTimer.textContent = `${min}:${sec}`;

    //when 0 seconds, stop timer and logout of the account 
    if (time === 0) {
      clearInterval(time);
      labelWelcome.textContent = `Log in to get started`;
      containerApp.style.opacity = 0;
    }

    //decrease time by 1 second 
    time--;
  }

  //call timer every second
  tick();
  timer = setInterval(tick, 1000); //store timer in global variable

  return timer;
}

//Calculate and display summary, balance and movements of an account
const updateUI = function (account) {
  displayMovements(account);
  calcDisplayBalance(account);
  calcDisplaySummary(account);
}

//create the usernames for each account in the app
const createUsernames = function (accounts) {
  accounts.forEach(function (account) {
    account.username = account.owner.toLowerCase().split(' ').map(name => name[0]).join(''); //creates a new property
  })
}
createUsernames(accounts); //automatically create the usernames of all the accounts

//function to display date of the movement
const formatMovementDate = function (date, locale) {
  const calcDaysPassed = (date1, date2) => Math.round(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24));
  const daysPssed = calcDaysPassed(new Date(), date);

  //determine how to display the date
  if (daysPssed === 0) return 'Today';
  if (daysPssed === 1) return 'Yesterday';
  if (daysPssed <= 7) return `${daysPssed} days ago`
  else {
    return new Intl.DateTimeFormat(locale).format(date);
  }
}

//function to format currency based on country/locale
const formatCurrency = function (value, locale, currency) {
  const formattedMov = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(value);

  return formattedMov;
}

//receive the array of movements from an account object and display it nicely formatted
const displayMovements = function (account, sort = false) {
  containerMovements.innerHTML = '';   //get rid of all the movement rows

  //determine how to display the movements
  const movs = sort ? account.movements.slice().sort((a, b) => a - b) : account.movements; //slice gives a copy of the array and not mutates it

  //add all the movement rows for the account
  movs.forEach(function (mov, i) {
    const type = mov > 0 ? 'deposit' : 'withdrawal'; //determine if the txn is a deposit or withdrawal

    const date = new Date(account.movementsDates[i]); //get the date of the corresponding movement
    const displayDate = formatMovementDate(date, account.locale); //format that date

    const formattedMov = formatCurrency(mov, account.locale, account.currency);

    //create the html code used to display the movmement row
    const html = `
    <div class="movements__row">
     <div class="movements__type movements__type--${type}">${i + 1} ${type}</div>
     <div class="movements__date">${displayDate}</div>
     <div class="movements__value">${formattedMov}</div>
    </div>
    `;

    containerMovements.insertAdjacentHTML('afterbegin', html); //add the html to the start of the container
  });
}

//calculate and display the total balance of the account
const calcDisplayBalance = function (account) {
  account.balance = account.movements.reduce((acc, mov) => mov + acc, 0); //creates a new property
  labelBalance.textContent = formatCurrency(account.balance, account.locale, account.currency);
}

//calculate and display the summary section of the account
const calcDisplaySummary = function (account) {
  //calculate the total deposits in the account
  const income = account.movements.filter(mov => mov > 0).reduce((acc, mov) => acc + mov, 0);
  labelSumIn.textContent = formatCurrency(income, account.locale, account.currency);

  //calulate the total withdrawals in the account
  const out = account.movements.filter(mov => mov < 0).reduce((acc, mov) => acc + mov, 0);
  labelSumOut.textContent = formatCurrency(Math.abs(out), account.locale, account.currency);

  //each deposit pays a 1.2 perecent interest if that amount is equal or greater than 1 dollar. Calculate the total interest amount
  const interest = account.movements.filter(mov => mov > 0).map(deposit => deposit * account.interestRate / 100).filter(interestAmt => interestAmt >= 1).reduce((acc, interestAmt) => acc + interestAmt, 0);
  labelSumInterest.textContent = formatCurrency(interest, account.locale, account.currency);
}