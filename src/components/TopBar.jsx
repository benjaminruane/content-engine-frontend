import React from "react";

function TopBar({
  workspaceName = "Single workspace",
  version = "v0.6.0-alpha",
  environment = "Alpha",
  userInitials = "BR",
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
        {/* Left: Product identity */}
        <div className="flex items-center gap-3">
          {/* CE monogram */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-900 text-xs font-semibold tracking-tight text-white">
            CE
          </div>

          {/* Title + workspace */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-gray-900">
              Content Engine
            </span>
            <span className="text-xs text-gray-500">
              {workspaceName}
            </span>
          </div>
        </div>

        {/* Right: environment, version, user */}
        <div className="flex items-center gap-3">
          {/* Environment pill */}
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="whitespace-nowrap">
              {environment}
            </span>
          </span>

          {/* Version pill */}
          <span className="inline-flex items-center rounded-full bg-gray-900 px-3 py-1.5 text-xs font-mono text-gray-100">
            {version}
          </span>

          {/* User avatar placeholder */}
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600 shadow-sm"
            aria-label="Account"
          >
            {userInitials}
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
