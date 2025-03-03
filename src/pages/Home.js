import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export default function Home() {
  const [data, setData] = useState([
    { month: "March", count: 0 },
    { month: "April", count: 0 },
    { month: "May", count: 0 },
    { month: "June", count: 0 },
    { month: "July", count: 0 },
    { month: "August", count: 0 },
    { month: "September", count: 0 },
  ]);

  const COLORS = ["#FFBB28", "#FF8042", "#00C49F", "#FF4B4B", "#9E4DFF", "#50B1E1", "#FF4993"];

  useEffect(() => {
    const fetchCompletedPCs = async () => {
      try {
        const pcCollection = collection(db, "pcs");
        const completedQuery = query(pcCollection, where("status", "==", "Completed"));
        const snapshot = await getDocs(completedQuery);

        const completedPcs = snapshot.docs.map((doc) => doc.data());

        console.log("📊 Fetched Completed PCs:", completedPcs);

        const monthlyCounts = {
          March: 0,
          April: 0,
          May: 0,
          June: 0,
          July: 0,
          August: 0,
          September: 0,
        };

        completedPcs.forEach((pc) => {
          let timestamp = null;

          if (pc.completedAt) {
            if (pc.completedAt.seconds) {
              timestamp = new Date(pc.completedAt.seconds * 1000); // Firestore Timestamp
            } else if (!isNaN(Date.parse(pc.completedAt))) {
              timestamp = new Date(pc.completedAt); // String date
            }
          }

          if (!timestamp || isNaN(timestamp.getTime())) {
            console.warn(`⚠️ Invalid or missing timestamp for:`, pc);
            return;
          }

          const month = timestamp.toLocaleString("en-US", { month: "long" });
          if (monthlyCounts[month] !== undefined) {
            monthlyCounts[month]++;
          }
        });

        console.log("📊 Monthly Counts:", monthlyCounts);

        const updatedData = Object.keys(monthlyCounts).map((month) => ({
          month,
          count: monthlyCounts[month],
        }));

        setData(updatedData);
      } catch (error) {
        console.error("❌ Error fetching completed PCs:", error);
      }
    };

    fetchCompletedPCs();
  }, []);

  return (
    <div className="container home" style={{ padding: "20px" }}>
      <h1>🚀 Welcome to PC Tracker</h1>
      <p>Monitor and track the progress of PC upgrades efficiently.</p>

      <h3>Status Overview (Monthly)</h3>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="month" outerRadius={150} fill="#8884d8" label>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
