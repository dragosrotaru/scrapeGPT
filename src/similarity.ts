function countNodes(node: ChildNode): number {
  let count = 1;
  for (const childNode of node.childNodes) {
    count += countNodes(childNode);
  }
  return count;
}

function countTotalNodes(doc: Document) {
  let totalNodes = 0;
  for (const node of doc.body.childNodes) {
    totalNodes += countNodes(node);
  }
  return totalNodes;
}

function calculateStructuralSimilarity(A: Document, B: Document): number {
  let similarity = 0;
  // Calculate the total number of nodes in both DOM trees
  const totalNodes = countNodes(A.body) + countNodes(B.body);

  // Compare the nodes in each DOM tree
  for (const node1 of A.body.childNodes) {
    for (const node2 of B.body.childNodes) {
      similarity += calculateNodeSimilarity(node1, node2);
    }
  }

  // Return the similarity as a ratio of matching nodes to total nodes
  return similarity / totalNodes;
}

function calculateNodeSimilarity<T extends Element | Text>(A: T, B: T): number {
  const isElements = nodeIsElement(A) && nodeIsElement(B);
  const isText = nodeIsText(A) && nodeIsText(B);

  if (isText) {
    return calculateTextSimilarity(A, B);
  } else if (isElements) {
    return calculateElementSimilarity(A, B);
  } else {
    return 0;
  }
}

function calculateElementSimilarity(A: Element, B: Element): number {
  // Short circuit, compare nodes as strings. if identical, return highest score
  if (A.outerHTML === B.outerHTML) {
    return 1;
  }

  let score = 0;
  let max = 2;

  // Compare node Name (name = element type)
  score += nodeNameIsEqual(A, B) ? 1 : 0;

  // Compare attributes
  score += nodeAttributeSimilarityScore(A, B);

  // Compare children
  const childrenA = filterChildNodes(A);
  const childrenB = filterChildNodes(B);
  max += longer(childrenA, childrenB).length;

  for (let i = 0; i < longer(childrenA, childrenB).length; i++) {
    const a = childrenA[i];
  }

  return score / max;
}

function calculateTextSimilarity(A: Text, B: Text): number {
  return A.textContent === B.textContent ? 1 : 0;
}

function filterChildNodes(node: ChildNode): (Element | Text)[] {
  const nodes: (Element | Text)[] = [];
  for (const childNode of node.childNodes) {
    if (nodeIsElement(childNode) || nodeIsText(childNode)) {
      nodes.push(childNode);
    }
  }
  return nodes;
}

function longer(A: unknown[], B: unknown[]): unknown[] {
  return A.length > B.length ? A : B;
}

function nodeIsElement(node: ChildNode): node is Element {
  return node.nodeType === Node.ELEMENT_NODE;
}

function nodeIsText(node: ChildNode): node is Text {
  return node.nodeType === Node.TEXT_NODE;
}

function nodeNameIsEqual(A: ChildNode, B: ChildNode): boolean {
  return A.nodeName === B.nodeName;
}

// TODO consider attributes where the value(s) order is irrelevant (like class names)
function nodeAttributeSimilarityScore(A: Element, B: Element): number {
  let score = 0;
  const names = new Set<string>();

  for (var i = 0; i < A.attributes.length; i++) {
    const a = A.attributes[i];
    names.add(a.name);
  }
  for (var i = 0; i < B.attributes.length; i++) {
    const b = B.attributes[i];
    names.add(b.name);
  }

  for (const name of names) {
    const a = A.getAttribute(name);
    const b = B.getAttribute(name);
    if (a === b) {
      score += 1;
    }
  }
  return score / names.size;
}

type TreeNode = {
  name: string;
  type: string;
  attributes: { [key: string]: string };
  children: TreeNode[];
};

function compareTrees(A: TreeNode, B: TreeNode): number {
  const m = A.children.length;
  const n = B.children.length;
  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (
        A.children[i - 1].name === B.children[j - 1].name &&
        A.children[i - 1].type === B.children[j - 1].type &&
        compareAttributes(
          A.children[i - 1].attributes,
          B.children[j - 1].attributes
        )
      ) {
        dp[i][j] =
          dp[i - 1][j - 1] + compareTrees(A.children[i - 1], B.children[j - 1]);
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

function compareAttributes(
  attributes1: { [key: string]: string },
  attributes2: { [key: string]: string }
): boolean {
  for (const key in attributes1) {
    if (attributes1[key] !== attributes2[key]) {
      return false;
    }
  }

  for (const key in attributes2) {
    if (attributes1[key] !== attributes2[key]) {
      return false;
    }
  }

  return true;
}

function calculateSimilarityScore(tree1: TreeNode, tree2: TreeNode): number {
  const totalNodes = countTreeNodes(tree1) + countTreeNodes(tree2);
  const matchingNodes = compareTrees(tree1, tree2);

  return matchingNodes / totalNodes;
}

function countTreeNodes(node: TreeNode): number {
  let count = 1;
  for (const child of node.children) {
    count += countTreeNodes(child);
  }
  return count;
}
