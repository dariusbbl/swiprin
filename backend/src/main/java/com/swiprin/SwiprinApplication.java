package com.swiprin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SwiprinApplication {
    public static void main(String[] args) {
        SpringApplication.run(SwiprinApplication.class, args);
    }
}
