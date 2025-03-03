import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { Table, Select, Input, message } from "antd";
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"; // Recharts

const { Option } = Select;

export default function Home() {
  const [pcs, setPcs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch PCs and listen for real-time updates
  useEffect(() => {
    const pcCollection = collection(db, "pcs");
  
    const unsubscribe = onSnapshot(pcCollection, (snapshot) => {
      const pcList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("📌 Firestore Data:", pcList); // Debugging log

      if (pcList.length === 0) {
        console.warn("⚠️ No PCs found in Firestore.");
      }

      setPcs(
        pcList.sort((a, b) => {
          const numA = parseInt(a.name.replace("PC-", ""), 10);
          const numB = parseInt(b.name.replace("PC-", ""), 10);
          return numA - numB; 
        })
      );
    }, (error) => {
      console.error("❌ Firestore Error:", error);
      message.error("Failed to load PCs from Firestore.");
    });

    return () => unsubscribe();
  }, []);

  // Update status of a PC in Firestore
  const updateStatus = async (id, value) => {
    try {
      const pcRef = doc(db, "pcs", id);
      const updateData = { 
        status: value, 
        lastUpdated: serverTimestamp() 
      };

      if (value === "Completed") {
        updateData.completedAt = serverTimestamp();
      }

      await updateDoc(pcRef, updateData);
      message.success(`PC ${id} marked as ${value}`);
    } catch (error) {
      console.error("❌ Error updating PC status:", error);
      message.error("Failed to update status.");
    }
  };

  // Assign technician to a PC in Firestore
  const assignTechnician = async (id, value) => {
    try {
      const pcRef = doc(db, "pcs", id);
      await updateDoc(pcRef, { technician: value, lastUpdated: serverTimestamp() });
      message.success(`Technician assigned to ${id}`);
    } catch (error) {
      console.error("❌ Error assigning technician:", error);
      message.error("Failed to assign technician.");
    }
  };

  // Process the data for the chart (status counts)
  const processChartData = () => {
    const statusCounts = pcs.reduce((acc, computer) => {
      const status = computer.status || "Unknown"; // Default to "Unknown" if status is missing
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(statusCounts).map((status) => ({
      status,
      count: statusCounts[status],
    }));
  };

  const chartData = processChartData(); // Processed data for the chart

  // Define colors for the pie chart slices
  const COLORS = ["#eee521", "#8435be", "#dbd553", "#ff5733", "#33ff57"]; // Expanded colors

  // Filter PCs by search term
  const filteredPCs = pcs.filter((pc) =>
    pc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log("📊 Filtered Table Data:", filteredPCs); // Debugging log

  const columns = [
    {
      title: "PC Name",
      dataIndex: "name",
      key: "name",
      align: 'center'
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text, record) => (
        <Select
          value={text}
          onChange={(value) => updateStatus(record.id, value)}
          style={{ width: 120 }}
        >
          <Option value="Pending">🟡 Pending</Option>
          <Option value="Completed">🟢 Completed</Option>
        </Select>
      ),
      align: 'center',
    },
    {
      title: "Technician",
      dataIndex: "technician",
      key: "technician",
      render: (text, record) => (
        <Input
          placeholder="Assign Technician"
          value={text}
          onChange={(e) => assignTechnician(record.id, e.target.value)}
        />
      ),
      align: 'center',
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#8435be" }}>
          🖥️ PC Upgrade Tracker
        </h2>

        {/* Search for PCs */}
        <Input
          placeholder="🔍 Search PC..."
          style={{
            marginBottom: 10,
            width: 250,
            borderRadius: 8,
            padding: 8,
            border: "1px solid #ccc",
          }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Graphs - Pie Chart */}
      <h3 style={{ marginBottom: "-40px" }}>Status Overview</h3>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="status"
            outerRadius="80%"
            fill="#8884d8"
            label
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {/* Table for PCs */}
      <Table
        dataSource={filteredPCs}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 20 }} // Display 20 PCs per page
        bordered
      />
    </div>
  );
}
