# 🧮 Derivation of BM25 Formula

BM25 (Best Match 25) was derived from the **Probabilistic Relevance Framework (PRF)**, originally introduced by **Stephen Robertson and Karen Sparck Jones** in the 1970s.  
It refines the **Binary Independence Model (BIM)** to better handle **term frequency** and **document length normalization**.

---

## 🔹 1. Starting Point: Binary Independence Model (BIM)

BIM assumes:

- Each term in a document is **independent**.
- Relevance of a document depends on the **presence or absence** of terms in a query.

We aim to compute:

```math
P(R = 1 | d, q) \quad \text{vs.} \quad P(R = 0 | d, q)
```

where:

- **R = 1** → document _d_ is relevant to query _q_
- **R = 0** → document _d_ is not relevant

We take the **odds ratio** (how much more likely it is that the doc is relevant than not):

```math
O(R|d, q) = \frac{P(R = 1 | d, q)}{P(R = 0 | d, q)}
```

---

## 🔹 2. Term-Level Probability

Under the independence assumption, the log odds can be written as:

```math
\log O(R|d, q) = \sum_{t \in q} \log \frac{P(t|R=1)}{P(t|R=0)}
```

This gives a **weight for each term** depending on how much more likely it appears in relevant docs vs non-relevant ones.

> **💡 Intuition:** If a term appears in 90% of relevant documents but only 10% of non-relevant ones, it should get a high weight.

However, we do **not** know the true relevance probabilities, so we **approximate** them statistically.

---

## 🔹 3. Approximating IDF (Inverse Document Frequency)

Suppose:

- **nₜ** = number of documents containing term _t_
- **N** = total number of documents

If a term appears in **fewer documents**, it should have **higher discriminative power**.

> **💡 Example:** The term "quantum" appears in 5 out of 10,000 documents → high discriminative power. The term "the" appears in 9,500 out of 10,000 documents → low discriminative power.

Robertson proposed the following empirical IDF form:

```math
IDF(t) = \log \left( \frac{N - n_t + 0.5}{n_t + 0.5} + 1 \right)
```

✅ This formula smooths extreme values by adding 0.5, and it increases when _nₜ_ is small.

**Why the +0.5 smoothing?**

- Prevents division by zero when _nₜ_ = 0
- Reduces extreme values when _nₜ_ is very small
- Makes the function more stable for rare terms

---

## 🔹 4. Introducing Term Frequency (TF)

BIM originally used a **binary** view (term present or not).  
However, in real documents, **repetition matters** — a term appearing multiple times strengthens relevance.

So, we adjust the score by **term frequency**:

```math
\text{weight}(t, d) = \frac{f(t, d)}{f(t, d) + k_1}
```

This ensures **diminishing returns** — the more times a word appears, the smaller the additional gain.

> **💡 Example:** If "machine" appears 1 time → weight ≈ 0.5, if it appears 10 times → weight ≈ 0.9, if it appears 100 times → weight ≈ 0.99. The gain from 1→10 is much larger than 10→100.

To control this effect:

- **k₁** (typically 1.2–2.0) controls TF scaling
  - Higher k₁ → more linear growth
  - Lower k₁ → more saturation

Later, **document length normalization** was added to correct for longer documents.

---

## 🔹 5. Document Length Normalization

Long documents tend to contain more words, which can **inflate TF** values unfairly.  
To compensate, BM25 normalizes term frequency by document length:

```math
f'(t, d) = \frac{f(t, d)}{1 - b + b \times \frac{|d|}{avgdl}}
```

where:

- **|d|** = length of the document
- **avgdl** = average document length
- **b** = normalization factor (usually 0.75)

This penalizes long documents proportionally.

> **💡 Example:** If avgdl = 1000 words:
>
> - Short doc (500 words): normalization factor = 1 - 0.75 + 0.75 × 0.5 = 0.625
> - Long doc (2000 words): normalization factor = 1 - 0.75 + 0.75 × 2.0 = 1.75
> - The long doc gets penalized by a factor of 1.75/0.625 ≈ 2.8

---

## 🔹 6. Combining Everything → BM25 Formula

Bringing it all together:

```math
\text{BM25}(d, q) = \sum_{t \in q} IDF(t) \times \frac{f(t, d) \times (k_1 + 1)}{f(t, d) + k_1 \times (1 - b + b \times \frac{|d|}{avgdl})}
```

This formula combines:

- **IDF weighting** → discriminative power of rare terms
- **TF saturation** → nonlinear increase for repeated terms
- **Length normalization** → fair comparison among documents

> **🔍 Complete Example:**
>
> - Query: "machine learning algorithm"
> - Document: "This machine learning algorithm uses advanced machine learning techniques for machine learning applications."
> - The term "machine" appears 4 times, "learning" appears 3 times, "algorithm" appears 1 time
> - BM25 will weight each term based on its frequency, document length, and IDF value

---

## 🔹 7. Derivation Summary (Conceptual Flow)

| Step | Idea                           | Formula                      | Purpose                              |
| ---- | ------------------------------ | ---------------------------- | ------------------------------------ |
| 1    | Start from Probabilistic Model | `O(R\|d, q)`                 | Estimate relevance likelihood        |
| 2    | Term independence              | `∑ log P(t\|R=1)/P(t\|R=0)`  | Weight each term                     |
| 3    | IDF from document statistics   | `log((N-n_t+0.5)/(n_t+0.5))` | Rare terms get more weight           |
| 4    | TF saturation                  | `f/(f+k₁)`                   | Avoid overemphasizing frequent terms |
| 5    | Length normalization           | `(1-b+b×\|d\|/avgdl)`        | Normalize long docs                  |
| 6    | Combine all                    | Full BM25 formula            | Final relevance score                |

---

## ✅ In Summary

BM25 was derived from a **probabilistic model** of relevance and refined using empirical observations.  
Its key contributions are:

- Probabilistic foundation (not just heuristic)
- Realistic handling of **term frequency saturation**
- **Length normalization** for fairness
- Adjustable parameters (**k₁**, **b**) for tuning performance

Thus, BM25 stands as the **most widely used ranking function** in modern search engines (Elasticsearch, Lucene, Solr, etc.)

---

**References:**

- Robertson, S. E., & Walker, S. (1994). _Some simple effective approximations to the 2-Poisson model for probabilistic weighted retrieval._ SIGIR.
- Manning, C. D., Raghavan, P., & Schütze, H. (2008). _Introduction to Information Retrieval._
