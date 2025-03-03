import React from "react";
import PCList from "../components/PClist";

export default function Dashboard() {
  return (
    <div className="container dashboard">
      <h2>🖥️ PC Dashboard</h2>
      <PCList />
    </div>
  );
}
