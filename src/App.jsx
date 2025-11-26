import React, { useState, useRef, useEffect } from "react";

// -----------------------------
// Basic utility components
// -----------------------------

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function Card({ children, className = "", ...props }) {
  return (
    <div
      className={classNames(
        "rounded-2xl border border-slate-200 bg-white shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className = "", ...props }) {
  return (
    <div
      className={classNames("flex items-start gap-3 px-4 py-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function CardBody({ children, className = "", ...props }) {
  return (
    <div className={classNames("px-4 pb-4 pt-0", className)} {...props}>
      {children}
    </d
