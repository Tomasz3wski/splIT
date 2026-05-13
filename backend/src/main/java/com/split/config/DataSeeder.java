package com.split.config;

import com.split.dto.AddPastExpenseRequest;
import com.split.dto.CreateUserRequest;
import com.split.service.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner initDatabase(UserService userService) {
        return args -> {
            try {
                CreateUserRequest u1 = new CreateUserRequest();
                u1.username = "Maks";
                userService.createUser(u1);
                addExpense(userService, "Maks", "Restaurant", 120.0);
                addExpense(userService, "Maks", "Bar", 80.0);
                addExpense(userService, "Maks", "Coffee", 25.0);
                addExpense(userService, "Maks", "Flight", 50.0);

                CreateUserRequest u2 = new CreateUserRequest();
                u2.username = "Bartek";
                userService.createUser(u2);
                addExpense(userService, "Bartek", "Hotel", 400.0);
                addExpense(userService, "Bartek", "Flight", 300.0);
                addExpense(userService, "Bartek", "Taxi", 100.0);
                addExpense(userService, "Bartek", "Restaurant", 50.0);

                CreateUserRequest u3 = new CreateUserRequest();
                u3.username = "Kuba";
                userService.createUser(u3);
                addExpense(userService, "Kuba", "Groceries", 30.0);
                addExpense(userService, "Kuba", "Tour", 40.0);
                addExpense(userService, "Kuba", "Museum", 15.0);

                CreateUserRequest u4 = new CreateUserRequest();
                u4.username = "Adam";
                userService.createUser(u4);
                addExpense(userService, "Adam", "Groceries", 100.0);

                System.out.println("------------------------------------------------------");
                System.out.println("✅ ZASILONO BAZĘ MOCKAMI!");
                System.out.println("Możesz teraz wpisać na froncie: Maks (Foodie), Bartek (Luxury), Kuba (Budget) lub Adam (Budget)");
                System.out.println("------------------------------------------------------");
            } catch (Exception e) {
                System.out.println("⚠️ Użytkownicy już istnieją w bazie.");
            }
        };
    }

    private void addExpense(UserService userService, String username, String category, double amount) {
        AddPastExpenseRequest req = new AddPastExpenseRequest();
        req.category = category;
        req.amount = amount;
        userService.addPastExpense(username, req);
    }
}