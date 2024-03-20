import React from "react";
import dayjs from "dayjs";
import { Snippet } from "@/types/Snippet";

type SnippetCardProps = {
  snippet: Snippet;
  index: number;
  runCode: (id: number) => void;
  checkResult: (id: number) => void;
  deleteSnippet: (id: number) => void;
};

const SnippetCard: React.FC<SnippetCardProps> = ({
  snippet,
  index,
  runCode,
  checkResult,
  deleteSnippet,
}) => {
  return (
    <div key={snippet.id} className="card bg-gray-800 rounded-lg">
      <div className="card-body">
        <h3 className="card-title text-lg text-white">
          Submission #{index + 1}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="text-sm text-gray-200">Username</div>
            <div className="text-white">{snippet.username}</div>
          </div>
          <div className="md:col-span-1">
            <div className="text-sm text-gray-200">Language</div>
            <div className="text-white">{snippet.code_language}</div>
          </div>
          <div className="md:col-span-1">
            <div className="text-sm text-gray-200">Stdin</div>
            <div className="text-white">{snippet.stdin}</div>
          </div>
          <div className="md:col-span-3">
            <div className="text-sm text-gray-200">Source Code</div>
            <div className="collapse collapse-arrow bg-base-100 rounded-box">
              <input type="checkbox" />
              <div className="collapse-title text-sm font-medium">
                {snippet.source_code.substring(0, 100)}
                {snippet.source_code.length > 100 && "..."}
              </div>
              <div className="collapse-content">
                <div className="text-sm text-gray-200 mb-2">Complete Code</div>
                <pre>{snippet.source_code}</pre>
              </div>
            </div>
          </div>
          <div className="md:col-span-1">
            <div className="text-sm text-gray-200">Timestamp</div>
            <div className="text-white">
              {dayjs(snippet.timestamp).format("MMMM D, YYYY h:mm A")}
            </div>
          </div>
          <div className="md:col-span-1">
            <div className="text-sm text-gray-200">Output</div>
            <div className="text-white">{snippet.output}</div>
          </div>
          <div className="md:col-span-1">
            <div className="text-sm text-gray-200">Token</div>
            <div className="text-white">{snippet.token}</div>
          </div>
          <div className="md:col-span-3 flex justify-start gap-2">
            <button
              onClick={() => runCode(snippet.id)}
              className="btn btn-primary"
            >
              Run Code
            </button>
            <button
              onClick={() => checkResult(snippet.id)}
              className="btn btn-primary"
            >
              Check Result
            </button>
            <button
              onClick={() => deleteSnippet(snippet.id)}
              className="btn btn-error"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnippetCard;
