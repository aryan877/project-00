"use client";

import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Snippet } from "@/types/Snippet";
import SnippetCard from "../components/SnippetCard";
const API_ORIGIN =
  process.env.NEXT_PUBLIC_EXPRESS_API_ORIGIN || "http://localhost:3001";

function Snippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    fetch(`${API_ORIGIN}/api/snippets`)
      .then((response) => response.json())
      .then((data: Snippet[]) => {
        setSnippets(data);

      })
      .catch((error: Error) => {
        console.error("Error fetching snippets:", error);
        toast.error("Failed to fetch snippets");
      }).finally(()=>{
        setLoading(false); 
      })
  }, []);

  const runCode = async (id: number) => {
    const snippet = snippets.find((snippet) => snippet.id === id);
    if (!snippet) return;

    try {
      const response = await axios.post(`${API_ORIGIN}/api/submitCode`, {
        source_code: snippet.source_code,
        language_id: getLanguageId(snippet.code_language),
        stdin: snippet.stdin,
      });

      setSnippets((prevSnippets) =>
        prevSnippets.map((s) =>
          s.id === id ? { ...s, token: response.data.token } : s
        )
      );
      toast.success("Code submitted successfully. Check Result.");
    } catch (error) {
      console.error("Error running code:", error);
      toast.error("Failed to run code");
    }
  };

  const checkResult = async (id: number) => {
    const snippet = snippets.find((snippet) => snippet.id === id);
    if (!snippet) return;

    if (!snippet.token) {
      toast.error("Please run the code submission first.");
      return;
    }

    try {
      const response = await axios.get(
        `${API_ORIGIN}/api/checkResult/${snippet.token}`
      );

      setSnippets((prevSnippets) =>
        prevSnippets.map((s) =>
          s.id === id ? { ...s, output: response.data.stdout } : s
        )
      );
    } catch (error) {
      console.error("Error checking result:", error);
      toast.error("Failed to check result");
    }
  };

  const getLanguageId = (language: string) => {
    switch (language) {
      case "C++":
        return 54;
      case "Java":
        return 62;
      case "JavaScript":
        return 63;
      case "Python":
        return 71;
      default:
        return 71;
    }
  };

  const deleteSnippet = (id: number) => {
    if (window.confirm("Are you sure you want to delete this snippet?")) {
      fetch(`${API_ORIGIN}/api/snippets/${id}`, { method: "DELETE" })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to delete snippet");
          }
          setSnippets((prevSnippets) =>
            prevSnippets.filter((snippet) => snippet.id !== id)
          );
          toast.success("Snippet deleted successfully");
        })
        .catch((error) => {
          console.error("Error deleting snippet:", error);
          toast.error("Failed to delete snippet");
        });
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen p-8">
      <ToastContainer />
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-16 text-center">
          Code Snippets
        </h1>
        <div className="mb-8 flex justify-between items-center">
          <button onClick={() => router.back()} className="btn btn-secondary">
            Back
          </button>
          <div className="text-2xl font-semibold text-white">
            Total Submissions: {snippets.length}
          </div>
        </div>
        {loading ? ( 
          <div className="text-center text-xl text-white">
            Loading snippets...
          </div>
        ) : (<div className="grid grid-cols-1 gap-4">
          {snippets.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {snippets.map((snippet, index) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  index={index}
                  runCode={runCode}
                  checkResult={checkResult}
                  deleteSnippet={deleteSnippet}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-xl text-white">
              There are no submissions yet.
            </div>
          )}
        </div>)}
      </div>
    </div>
  );
}

export default Snippets;
