import { CodeTemplate } from '../types';

export const CODE_TEMPLATES: CodeTemplate[] = [
  {
    id: 'hello-world',
    name: 'Hello World',
    description: 'Basic Java starter template printing a message to console',
    input: '',
    code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`
  },
  {
    id: 'stdin-scanner',
    name: 'STDIN Scanner & Sum',
    description: 'Reading input using java.util.Scanner',
    input: '5\n10 20 30 40 50',
    code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.print("Reading count... ");
        if (scanner.hasNextInt()) {
            int n = scanner.nextInt();
            System.out.println("Count: " + n);
            
            int sum = 0;
            System.out.print("Numbers: ");
            for (int i = 0; i < n; i++) {
                if (scanner.hasNextInt()) {
                    int val = scanner.nextInt();
                    System.out.print(val + " ");
                    sum += val;
                }
            }
            System.out.println("\nTotal Sum = " + sum);
        } else {
            System.out.println("No input provided in STDIN panel.");
        }
    }
}`
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci Series',
    description: 'Generate Fibonacci sequence up to N numbers',
    input: '10',
    code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.hasNextInt() ? sc.nextInt() : 10;
        
        System.out.println("Generating first " + n + " Fibonacci numbers:");
        
        long a = 0, b = 1;
        for (int i = 1; i <= n; i++) {
            System.out.print(a + (i == n ? "" : ", "));
            long next = a + b;
            a = b;
            b = next;
        }
        System.out.println();
    }
}`
  },
  {
    id: 'bubble-sort',
    name: 'Array Sorting',
    description: 'Sorting an array of numbers using Bubble Sort',
    input: '64 34 25 12 22 11 90',
    code: `import java.util.Scanner;
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int[] arr = new int[]{64, 34, 25, 12, 22, 11, 90};
        
        System.out.println("Original Array: " + Arrays.toString(arr));
        
        // Bubble Sort
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
        
        System.out.println("Sorted Array:   " + Arrays.toString(arr));
    }
}`
  },
  {
    id: 'oop-demo',
    name: 'Object Oriented Java',
    description: 'Classes, constructors, and methods in Java',
    input: '',
    code: `public class Main {
    static class Student {
        private String name;
        private int age;
        private double gpa;

        public Student(String name, int age, double gpa) {
            this.name = name;
            this.age = age;
            this.gpa = gpa;
        }

        public void displayInfo() {
            System.out.println("Student: " + name + " | Age: " + age + " | GPA: " + gpa);
        }
    }

    public static void main(String[] args) {
        Student s1 = new Student("Alice", 20, 3.9);
        Student s2 = new Student("Bob", 22, 3.7);

        s1.displayInfo();
        s2.displayInfo();
    }
}`
  }
];
