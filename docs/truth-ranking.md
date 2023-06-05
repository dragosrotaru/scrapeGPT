# Truth Ranking

## Round 2

- A Source commits a Claim to a Topic with a Confidence and optionally, a Proof
- A Source starts with a Credibility of 0 per Topic, and it is earned over time
- Credibility should be awarded in a way that is relative to the amount of new information provided. So If a Source makes a well established claim, their Credibility increase is marginal.
- Credibility should also be awarded in a way that is relative to how well a Claim has been corroborated.

Early vs Corroborated

Credibility depends on:

1. new information x corroboration x early_factor x trust

## THEORY

- There are composable Sources
- There are Observations made on Sources
- Observations Return Assertions
- Assertions can be of the following type:
    - Existance (e.g Phone Number exists)
    - Associative (e.g. Phone Number belongs to Person)
    - Properties (e.g. Natural Language Descriptions)
- Assertions are Validated and Verified
- Validation of an assertion entails checking if the assertion is possible
- Verification of an assertion entails checking if the assertion is true
- Failed Validation/Verifications are logged.
- A subset of assertions can be verified. These are called Ground Truth.
- Source credibility is infered from Ground Truth.
- Source Credibility in part determines data confidence level
- Data Confidence level also depends on confidence of predicates if any
- An Assertion Must be Possible (Validated) for it to be True (Verified)
- An Assertion Must be False for it to be Impossible
- If an Assertion is Impossible, the source, the channel or both must be unreliable.
- If an Assertion is True, the source and channel are reliable.
- There is a fault classifier which attributes faults to Source and/or Channel.
- Such Classifier may use temporal validation/verification data as features.
- This may also be used for Edge-Case Auto Discovery, i.e. in constructing a channel which is reliable.
- The Construction of Channels must balance the specificity and robustness of selectors
- Data Confidence Level is used in Garbage collection
- Observations are the foundation for Freshness (Data Decay) in a similar way to how
Verifications are the foundation to Credibility

## CONSIDERATIONS

- Source Dependency (copying, latent source)
- Source Granularity
- Source Recall vs Accuracy
- Source Specialization
- Source Inherent Authority
- Source Assertion Distribution
- Source Semantic Ambiguity
- Fault Distribution
- Fault Attribution (Source vs Extractor)
- Knowledge Scarcity
- Knowledge Decay
- Knowledge Inference
- Knowledge Dependency (Conditionality of Truths)
- Knowledge Dependency (Mutable / Time dependent Truths)

## ALGORITHMS

- [TruthFinder](http://localhost:8080/#TruthFinder) (Yin et al 2008)
- ACCU, DEPEN (Dong et al 2009)
- ACCU Series (Li et al 2013)
- [PrecRec](http://localhost:8080/#PrecRec) (Pochampally et all 2014)
- Scale Up Copy (Li et al 2015)
- FACTY (Li et al 2017)
- Latent Truth Machine (Zhao et al 2012)
- Knowledge Based Trust (Dong et al. 2015)
- Gaussian Truth Model
- GLAD (Whitehill et al 2009)
- CRH (Li et al 2014)
- Minimax Entropy (Zhou et al 2012)
- [SLiMFast](http://localhost:8080/#SLiMFast) (Rekatsinas et al 2016)
- Query Perturbation (Wu et al 2017)