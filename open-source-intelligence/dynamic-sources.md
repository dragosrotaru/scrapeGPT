# Dynamic Sources

## Theory

- Source: named, interactable, composable Entity in the Domain.
- Model: information-efficient definition of Source
- Builder: Model => Reified Source
- Models are Composable in 3 ways:
** Orthogonal (Homogenous Source): Source model composed of orthogonal sub-models of the same Source.
** Namespace (Homogenous Model): Source model composed of child-Source models or parent-Resource.
** Out of Band (Heterogenous): Source model composed of model not connected to the Source or its children/parent.
- The chosen Namespace impacts the composability of resource.
- 1 Namespace per Aspect. Namespaces form DAGs, each node is a static model.
- Master ID Space, each ID is a set of Names
- Builder: (ID) => reified Source.

## Framework

- Aspect
    - NameSpace
        - DAG
        - Indexing
        - Resolution
    - Model
        - Schema
        - Storage
    - Types
        - Extraction
        - Validation
        - Data Model
        - URLs / IDs
        - Persistance
        - Caching
        - Health
- Recurring Workflows
    - KnowledgeRank
    - Keeper
    - Crawler
- All Nodes:
    - SourceModel
    - NamedSource
- Internal Nodes Only:
    - NamedSourceCollection (Child NamedSources)
- Leaf Nodes Only:
    - ConcreteSource
    - ConcreteSourceCollection
- SourceModel
    - name
    - parent
    - children
    - urlModel
    - taskModelCollection
- ConcreteSource
- url
- ConcreteSourceCollection
- NamedSource
- SourceModel
- Name