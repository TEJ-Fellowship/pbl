# 📘 Key Concepts of BM25

BM25 (Best Match 25) is a **ranking function** used by search engines to estimate the relevance of documents to a given query. It improves upon TF-IDF by addressing its limitations such as document length normalization and diminishing returns of term frequency.

---

## 🔹 1. Term Frequency (TF)

**Definition:**  
TF measures how frequently a term appears in a document, but BM25 modifies it to reduce the effect of very frequent words (diminishing returns).

### **Formula:**

```math
TF = \frac{(f(t, d) \times (k_1 + 1))}{f(t, d) + k_1 \times (1 - b + b \times \frac{|d|}{avgdl})}
```

Where:

- **f(t, d)** = frequency of term _t_ in document _d_
- **|d|** = length of the document
- **avgdl** = average document length across all documents
- **k₁** = term frequency scaling factor (typically between 1.2 and 2.0)
- **b** = length normalization factor (typically 0.75)

### **Intuition:**

- When the term appears more times, the TF increases but **less sharply** (nonlinear).
- Long documents are **penalized** using the length normalization term.

### **Example:**

Let:

- f(t, d) = 10
- |d| = 1000
- avgdl = 500
- k₁ = 1.5, b = 0.75

Then:

```math
TF = \frac{10 \times (1.5 + 1)}{10 + 1.5 \times (1 - 0.75 + 0.75 \times 1000/500)} = \frac{25}{10 + 2.25} \approx 2.04
```

---

## 🔹 2. Inverse Document Frequency (IDF)

**Definition:**  
IDF measures how important a term is across the entire collection. Rare terms get higher weights.

### **Formula:**

```math
IDF = \log\left(\frac{N - n_t + 0.5}{n_t + 0.5} + 1\right)
```

Where:

- **N** = total number of documents
- **nₜ** = number of documents containing term _t_

### **Example:**

Let:

- N = 10000
- nₜ = 100

Then:

```math
IDF = \log\left(\frac{10000 - 100 + 0.5}{100 + 0.5} + 1\right) = \log(100.5) \approx 4.61
```

---

## 🔹 3. BM25 Score

**Formula:**

```math
score(d, q) = \sum_{t \in q} IDF(t) \times \frac{f(t, d) \times (k_1 + 1)}{f(t, d) + k_1 \times (1 - b + b \times \frac{|d|}{avgdl})}
```

Where the sum is taken over all query terms _t_.

### **Example:**

For a query with one term “cat”,  
Let:

- f(t, d) = 10
- |d| = 1000
- avgdl = 500
- N = 10000, nₜ = 100
- k₁ = 1.5, b = 0.75

Then:

```math
IDF = 4.61, \quad TF = 2.04
```

So:

```math
score = 4.61 \times 2.04 = 9.41
```

---

## 🔹 4. Why BM25 is Better Than TF-IDF

| Feature                                | TF-IDF   | BM25                          |
| -------------------------------------- | -------- | ----------------------------- |
| Document length normalization          | ❌ No    | ✅ Yes                        |
| Diminishing returns for term frequency | ❌ No    | ✅ Yes                        |
| Parameter tuning                       | ❌ None  | ✅ k₁ and b allow flexibility |
| Real-world search performance          | Moderate | Excellent                     |

---

## ✅ **In Summary:**

BM25 is essentially a **refined version of TF-IDF**, incorporating:

- **Nonlinear term frequency scaling** (handles diminishing returns)
- **Document length normalization**
- **More realistic relevance estimation** for information retrieval tasks.
