# Understanding Problems with TF-IDF

TF-IDF (Term Frequency–Inverse Document Frequency) is a classic method to measure how relevant a document is to a search query.  
However, it has two major problems that BM25 solves.

---

## Problem 1: Document length ignores density

### Explanation
TF-IDF calculates raw term frequency (TF) as the number of times a word appears in a document, without considering document length.  
This means long documents can seem more relevant simply because they contain more words, even if the keyword density is low.

### Example 1

| Document | Length (words) | “cat” occurrences | TF | Density |
|----------|----------------|-----------------|----|---------|
| A        | 10             | 1               | 1  | 10%     |
| B        | 1000           | 10              | 10 | 1%      |

- TF-IDF gives Document **B** a higher score (TF = 10) than Document **A** (TF = 1).  
- However, Document **A** is more relevant because **10% of its content** is about “cat”, compared to only **1%** in Document **B**.

### Example 2

Search query: **“Python programming”**

| Document | Length | Keyword count | Density |
|----------|--------|---------------|---------|
| A        | 50     | 5             | 10%     |
| B        | 2000   | 20            | 1%      |

- TF-IDF ranks **B** higher because it contains more total occurrences.
- But Document **A** might be a concise tutorial, while **B** could be a long, mixed-topic article.
- TF-IDF **ignores how efficiently** a document discusses the query topic.

---

## Problem 2: No diminishing returns

### Explanation
TF-IDF increases *linearly* with term frequency.  
Every additional occurrence adds the same score, even when it adds little new meaning.

In reality:
- The **first few occurrences** are highly informative.
- After a point, extra repetitions add almost no extra relevance.

### Example 1

Search: **“machine learning”**

| Document | Occurrences of query | TF-IDF contribution |
|----------|----------------------|---------------------|
| A        | 1                    | 5                   |
| B        | 2                    | 10                  |
| C        | 100                  | 500                 |
| D        | 101                  | 505                 |

TF-IDF gives every additional occurrence the same reward.  
But going from 100 → 101 occurrences does **not** increase usefulness as much as going from 1 → 2.

### Example 2

Search: **“cat”**

| Document | Length | Cat occurrences | TF-IDF Score |
|----------|--------|----------------|--------------|
| A        | 10     | 1              | 5            |
| B        | 10     | 2              | 10           |
| C        | 10     | 10             | 50           |

- TF-IDF treats 1 → 2 and 9 → 10 equally.
- Realistically, the 10th “cat” doesn’t add much meaning.

---

## Summary

| Problem | What happens | Why it’s bad |
|---------|---------------|--------------|
| **Document length ignored** | Long documents with sparse keyword density get high scores | Users get less relevant results |
| **No diminishing returns** | Every repetition adds same score | Enables keyword stuffing, misrepresents true relevance |

---

## How BM25 Fixes It

✅ **Document Length Normalization**  
BM25 penalizes long documents, reducing scores if a keyword is spread thinly.  

✅ **Diminishing Returns**  
BM25 applies a saturation curve so each additional keyword contributes less.  

Thus, BM25 provides **more realistic, user-relevant rankings** compared to TF-IDF.
