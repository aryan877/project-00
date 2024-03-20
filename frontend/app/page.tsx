"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";

const formSchema = z.object({
  username: z.string().min(1, "Username is required"),
  codeLanguage: z.enum(["C++", "Java", "JavaScript", "Python"]),
  stdin: z.string().min(1, "Standard input is required"),
  sourceCode: z.string().min(1, "Source code is required"),
});

type FormData = z.infer<typeof formSchema>;

const examples = {
  "C++": {
    stdin: "5\n2 4 6 8 10",
    sourceCode: `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    vector<int> arr(n);\n    for (int i = 0; i < n; i++) {\n        cin >> arr[i];\n    }\n    int sum = 0;\n    for (int i = 0; i < n; i++) {\n        sum += arr[i];\n    }\n    cout << "Sum of array elements: " << sum << endl;\n    return 0;\n}`,
  },
  Java: {
    stdin: "5\n2 4 6 8 10",
    sourceCode: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        int n = scanner.nextInt();\n        int[] arr = new int[n];\n        for (int i = 0; i < n; i++) {\n            arr[i] = scanner.nextInt();\n        }\n        int sum = 0;\n        for (int i = 0; i < n; i++) {\n            sum += arr[i];\n        }\n        System.out.println("Sum of array elements: " + sum);\n        scanner.close();\n    }\n}`,
  },
  JavaScript: {
    stdin: "5\n2 4 6 8 10",
    sourceCode: `const input = require('fs').readFileSync('/dev/stdin', 'utf8');\nconst lines = input.split('\\n');\nconst n = parseInt(lines.shift());\nconst arr = lines.shift().split(' ').map(Number);\nlet sum = 0;\nfor (let i = 0; i < n; i++) {\n    sum += arr[i];\n}\nconsole.log('Sum of array elements:', sum);`,
  },
  Python: {
    stdin: "5\n2 4 6 8 10",
    sourceCode: `n = int(input())\narr = list(map(int, input().split()))\nprint('Sum of array elements:', sum(arr))`,
  },
};

export default function Home() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      const response = await fetch("http://localhost:3001/api/snippets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      const responseData = await response.json();
      console.log(responseData);
      toast.success("Snippet added successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit snippet. Please try again.");
    }
  };

  const onError = () => {
    toast.error("Please check your input and try again.");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!");
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900">
      <ToastContainer />
      <h1 className="text-5xl font-bold text-white mb-16 text-center">
        Submit Code
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
        <div className="card bg-gray-800 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-center text-white">
              Submit Code Snippet
            </h2>
            <form onSubmit={handleSubmit(onSubmit, onError)}>
              <div className="form-control">
                <label htmlFor="username" className="label">
                  <span className="label-text text-gray-200">Username</span>
                </label>
                <input
                  type="text"
                  id="username"
                  {...register("username")}
                  className="input input-bordered input-primary w-full text-gray-200 bg-gray-800"
                />
                {errors.username && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.username.message}
                  </p>
                )}
              </div>
              <div className="form-control">
                <label htmlFor="codeLanguage" className="label">
                  <span className="label-text text-gray-200">
                    Code Language
                  </span>
                </label>
                <select
                  id="codeLanguage"
                  {...register("codeLanguage")}
                  className="select select-bordered select-primary w-full text-gray-200 bg-gray-800"
                >
                  <option value="C++">C++</option>
                  <option value="Java">Java</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="Python">Python</option>
                </select>
                {errors.codeLanguage && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.codeLanguage.message}
                  </p>
                )}
              </div>
              <div className="form-control">
                <label htmlFor="stdin" className="label">
                  <span className="label-text text-gray-200">
                    Standard Input
                  </span>
                </label>
                <textarea
                  id="stdin"
                  {...register("stdin")}
                  className="textarea textarea-bordered textarea-primary h-20 text-gray-200 bg-gray-800"
                ></textarea>
                {errors.stdin && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.stdin.message}
                  </p>
                )}
              </div>
              <div className="form-control">
                <label htmlFor="sourceCode" className="label">
                  <span className="label-text text-gray-200">Source Code</span>
                </label>
                <textarea
                  id="sourceCode"
                  {...register("sourceCode")}
                  className="textarea textarea-bordered textarea-primary h-32 text-gray-200 bg-gray-800"
                ></textarea>
                {errors.sourceCode && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.sourceCode.message}
                  </p>
                )}
              </div>
              <div className="form-control mt-6">
                <button type="submit" className="btn btn-primary w-full">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="card bg-gray-800 shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-center text-white">
              Try Out Examples
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(examples).map(([language, example]) => (
                <div
                  key={language}
                  className="collapse collapse-arrow bg-gray-700 rounded-box"
                >
                  <input type="checkbox" />
                  <div className="collapse-title text-white font-medium">
                    {language}
                  </div>
                  <div className="collapse-content">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-gray-200">
                          Standard Input
                        </span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered textarea-primary h-20 text-gray-200 bg-gray-800"
                        readOnly
                        value={example.stdin}
                      ></textarea>
                      <button
                        className="btn btn-sm btn-primary mt-2"
                        onClick={() => copyToClipboard(example.stdin)}
                      >
                        Copy Stdin
                      </button>
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-gray-200">
                          Source Code
                        </span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered textarea-primary h-32 text-gray-200 bg-gray-800"
                        readOnly
                        value={example.sourceCode}
                      ></textarea>
                      <button
                        className="btn btn-sm btn-primary mt-2"
                        onClick={() => copyToClipboard(example.sourceCode)}
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4">
                <Link href="/snippets" className="btn btn-primary">
                  View all Submissions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
