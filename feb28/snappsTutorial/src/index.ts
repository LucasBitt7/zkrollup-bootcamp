import * as readline from 'readline';
import {
  Field,
  PublicKey,
  SmartContract,
  state,
  State,
  isReady,
  Mina,
  Party,
  PrivateKey,
  method,
  UInt64,
  shutdown,
  Poseidon,
  Signature,
} from 'snarkyjs';

export class Guess extends SmartContract {
  @state(Field) hashOfGuess = State<Field>();
  @state(PublicKey) ownerAddr = State<PublicKey>();

  deploy(initialbalance: UInt64, ownerAddr: PublicKey) {
    super.deploy();
    this.ownerAddr.set(ownerAddr);
    this.balance.addInPlace(initialbalance);
  }

  @method async startRound(x: Field, signature: Signature, guess: number) {
    let ownerAddr = await this.ownerAddr.get();
    signature.verify(ownerAddr, [x]).assertEquals(true);
    this.hashOfGuess.set(Poseidon.hash([Field(guess)]));
  }

  @method async submitGuess(guess: number) {
    let userHash = Poseidon.hash([Field(guess)]);
    let stateHash = await this.hashOfGuess.get();
    stateHash.assertEquals(userHash);
  }

  @method async guessMultiplied(guess: number, guessTimes3: number) {
    let userHash = Poseidon.hash([Field(guess)]);
    let stateHash = await this.hashOfGuess.get();
    stateHash.assertEquals(userHash);
    Field(guessTimes3).assertEquals(guess * 3);
    this.balance.subInPlace(UInt64.fromNumber(100));
  }
}

export async function run() {
  await isReady;

  const Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  const account1 = Local.testAccounts[0].privateKey;
  const account2 = Local.testAccounts[1].privateKey;

  const snappPrivkey = PrivateKey.random();
  const snappPubkey = snappPrivkey.toPublicKey();

  let snappInstance: Guess;

  //deploy the snapp
  await Mina.transaction(account1, async () => {
    // account2 sends 1000000000 to the new snapp account
    const amount = UInt64.fromNumber(1000000000);
    const p = await Party.createSigned(account2);
    p.balance.subInPlace(amount);
    snappInstance = new Guess(snappPubkey);
    snappInstance.deploy(amount, account1.toPublicKey());
  })
    .send()
    .wait();
  // const a = await Mina.getAccount(snappPubkey);
  console.log(
    'snapp balance after deployment: ',
    (await Mina.getBalance(snappPubkey)).toString()
  );
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  console.log('Owner starts the round');
  rl.question('what should be the secret number? \n', async (answer) => {
    let guess = Number(answer);
    rl.close();
    await Mina.transaction(account1, async () => {
      const x = Field.zero;
      const signature = Signature.create(account1, [x]);

      await snappInstance.startRound(x, signature, guess);
    })
      .send()
      .wait();
    let r2 = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    console.log('Switching to user 2 in 3 sec...');
    await sleep(1000);
    console.log('2 sec ...');
    await sleep(1000);
    console.log('1 sec ...');
    await sleep(1000);
    console.clear();

    const a = await Mina.getAccount(snappPubkey);
    console.log(
      'User 2 starting balance  ',
      (await Mina.getBalance(account2.toPublicKey())).toString()
    );
    console.log('hash of the guess is:', a.snapp.appState[0].toString());
    r2.question('Hey user2, what is your guess? \n', async (userAnswer) => {
      let answer = Number(userAnswer);
      try {
        await Mina.transaction(account2, async () => {
          await snappInstance.submitGuess(answer);
        })
          .send()
          .wait();
        r2.close();
        console.log('Correct guess but ...');
      } catch {
        r2.close();
        console.log('Wrong guess!!');
        throw new Error();
      }
      let r3 = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      console.log('Validate that you are not a robot 🤖🤖🤖');
      r3.question('your guess multiplied by 3 is : \n', async (value) => {
        try {
          let valueNumber = Number(value);
          await Mina.transaction(account2, async () => {
            await snappInstance.guessMultiplied(answer, valueNumber);
            const amount = UInt64.fromNumber(100);
            const p = Party.createUnsigned(account2.toPublicKey());
            p.balance.addInPlace(amount);
          })
            .send()
            .wait();
          console.log('correct!');
          console.log(
            'User 2 balance after correct guess ',
            (await Mina.getBalance(account2.toPublicKey())).toString()
          );
          console.log(
            'snapp balance after payout: ',
            (await Mina.getBalance(snappPubkey)).toString()
          );
          r3.close();
        } catch (e) {
          console.log(e);
          console.log("wrong, you're a robot!");
          r3.close();
        }
      });
    });
  });
}

run();
shutdown();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
