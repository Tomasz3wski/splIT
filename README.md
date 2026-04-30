# SplIT — AI Budgeting for Group Expenses

> **Course:** Biologically Inspired Artificial Intelligence  
> **Authors:** Bartłomiej Barański, Maksymilian Pierchala, Jakub Tomaszewski

## Overview

SplIT solves the chaos of group travel expenses. Instead of settling debts _after_ a trip, SplIT uses a **Genetic Algorithm** to proactively suggest _who should pay now_, keeping group balances near zero throughout the entire trip.

## Project Structure

```
split/
├── data-generator/     # Faker-based synthetic dataset generation
├── ga-engine/          # Genetic Algorithm (PyGAD) core
├── backend/            # Spring Boot REST API
├── frontend/           # React web frontend
├── data/
│   └── generated/      # Generated CSVs (gitignored)
└── docs/               # Report and documentation
```

## Quick Start

### 1. Generate synthetic data

```bash
cd data-generator
pip install -r requirements.txt
python generate.py
```

### 2. Run the GA engine

```bash
cd ga-engine
pip install -r requirements.txt
python main.py
```

### 3. Run the backend

```bash
cd backend
./mvnw spring-boot:run
```

### 4. Run the frontend

```bash
cd frontend
npm install && npm start
```

## User Archetypes

| Archetype    | Behaviour                                   |
| ------------ | ------------------------------------------- |
| **Sponsor**  | Pays for high-value items (hotels, flights) |
| **Retailer** | Pays for low-value items (coffee, taxis)    |
| **Saver**    | Avoids payment prompts when possible        |

## GA Design

- **Chromosome** — ordered sequence of (expense → payer) assignments for a trip
- **Fitness function** — minimise variance of group balances at trip end
- **Operators** — single-point crossover, random mutation, tournament selection
