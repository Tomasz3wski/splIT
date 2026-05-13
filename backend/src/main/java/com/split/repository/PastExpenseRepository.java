package com.split.repository;

import com.split.model.PastExpense;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PastExpenseRepository extends JpaRepository<PastExpense, Long> {}