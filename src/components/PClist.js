import React, { useState, useEffect } from "react";
import { Table, Select, Input, message } from "antd";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc, onSnapshot, writeBatch } from "firebase/firestore";

const { Option } = Select;

export default function PCList() {
  const [pcs, setPcs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Fetch PCs & Listen for Real-Time Updates
  useEffect(() => {
    const pcCollection = collection(db, "pcs");

    const unsubscribe = onSnapshot(pcCollection, async (snapshot) => {
      const existingPCs = snapshot.docs.map((doc) => parseInt(doc.id.replace("PC-", ""), 10)).filter(n => !isNaN(n));
      
      if (existingPCs.length < 900) {
        console.warn("⚠️ Some PCs are missing! Ensuring full 1-900 range...");
        await initializePCs(existingPCs);
      } else {
        console.log("✅ Firestore data fetched!");
      }

      const pcList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 🔹 Sort PCs numerically before updating state
      setPcs(
        pcList.sort((a, b) => {
          const numA = parseInt(a.name.replace("PC-", ""), 10);
          const numB = parseInt(b.name.replace("PC-", ""), 10);
          return numA - numB; // Sort numerically
        })
      );
    }, (error) => {
      console.error("❌ Error fetching PCs:", error);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Ensure PCs 1-900 exist in Firestore
  const initializePCs = async (existingPCs) => {
    try {
      const batchSize = 500;
      let missingPCs = [];

      for (let i = 1; i <= 900; i++) {
        if (!existingPCs.includes(i)) {
          missingPCs.push(i);
        }
      }

      if (missingPCs.length === 0) {
        console.log("✅ All 1-900 PCs already exist. No action needed.");
        return;
      }

      console.log(`🔄 Creating ${missingPCs.length} missing PCs...`);

      for (let i = 0; i < missingPCs.length; i += batchSize) {
        const batch = writeBatch(db);
        for (let j = i; j < Math.min(i + batchSize, missingPCs.length); j++) {
          const pcNumber = missingPCs[j];
          const pcRef = doc(db, "pcs", `PC-${pcNumber}`);
          batch.set(pcRef, { name: `PC-${pcNumber}`, status: "Pending", technician: "" }, { merge: true });
        }
        await batch.commit();
      }

      console.log("🔥 Missing PCs initialized in Firestore!");
    } catch (error) {
      console.error("❌ Error initializing PCs:", error);
    }
  };

  // ✅ Update Status in Firestore
  const updateStatus = async (id, value) => {
    try {
      const pcRef = doc(db, "pcs", id);
      await updateDoc(pcRef, { status: value });
      message.success(`PC ${id} marked as ${value}`);
    } catch (error) {
      console.error("❌ Error updating PC status:", error);
      message.error("Failed to update status.");
    }
  };

  // ✅ Assign Technician in Firestore
  const assignTechnician = async (id, value) => {
    try {
      const pcRef = doc(db, "pcs", id);
      await updateDoc(pcRef, { technician: value });
      message.success(`Technician assigned to ${id}`);
    } catch (error) {
      console.error("❌ Error assigning technician:", error);
      message.error("Failed to assign technician.");
    }
  };

  // 🔍 Filter PCs by search
  const filteredPCs = pcs.filter((pc) =>
    pc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: "PC Name",
      dataIndex: "name",
      key: "name",
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
          <Option value="In Progress">🟠 In Progress</Option>
          <Option value="Completed">🟢 Completed</Option>
        </Select>
      ),
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
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#6200EA" }}>
        🖥️ PC Upgrade Tracker
      </h2>
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
    