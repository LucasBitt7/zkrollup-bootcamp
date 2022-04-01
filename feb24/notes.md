## Eliptic Curves
Curve follows the equation:
{y^2 = x^3 + ax + b}

There is an identity element in elliptic curves
The points on a curve form a group

When using for crypto, you get higher security for a smaller key size

## Verifiable Random Functions
Generate pseudorandom output based on input with a proof that it was done correctly
- Chainlink
- Algorand libsodium

## zkSNARKS

Involves 3 algorithms: *C, P, V*

Creator takes a secret parameter *lambda* and *C* to generate 2 public keys:
- proving key *pk*
- verifying key *vk*

Prover takes *pk*, a public input *x*, and a private witness *w* (the secret they want to prove they have). Peggy generates a proof:
{pr = P(pk, x, w)}

Verifier (Victor) computes V(vk, x, pr) which returns true if correct, or false otherwise.

### Trusted Setup

The secret param lambda is very important.  If someone knows lambda, they can create false proofs. You can get around this by doing a multi-party computation where every party has a piece of lambda but nobody knows all of it.



