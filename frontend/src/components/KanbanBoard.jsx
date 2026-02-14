import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { v4 as uuid } from "uuid";

const socket = io("https://fork-2-intern-1.onrender.com/"); //connecting to backend
const columns = ["todo", "in-progress", "done"];//creating column

const role =
    new URLSearchParams(window.location.search).get("role") || "creator"; //creating another page 

export default function KanbanBoard() {
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState("");
    const [priority, setPriority] = useState("Low");
    const [category, setCategory] = useState("Feature");

    useEffect(() => { //getting previous task data if any
        socket.on("sync:tasks", (data) => {
            setTasks(data);
        });

        return () => {
            socket.off("sync:tasks");
        };
    }, []);

    const createTask = () => {
        if (!title.trim()) return;
        const newTask = {
            id: uuid(),//unique id for each task
            title,
            column: "todo",//by default
            priority,
            category
        }
        console.log(newTask)
        socket.emit("task:create", newTask);

        setTitle("");
    };

    const moveTask = (id, column) => {// function that will help us moving the task to desired feild
        socket.emit("task:move", { id, column });//calls out for respective backend code
    };

    const deleteTask = (id) => {// function that will help us deleting the task 
        socket.emit("task:delete", id);//calls out for respective backend code
    };

    const updateTaskTitle = (task, newTitle) => { // function that will help us update the task 
        socket.emit("task:update", {
            ...task,//updating by keeping the inside task as it is
            title: newTitle
        });//calls out for respective backend code
    };
    const params = new URLSearchParams(window.location.search);
    const role = params.get("role") || "creator";//get user role from URL query params; default to "creator"if nothing if provided

    return (
        <div className="min-h-screen bg-red-100">
            <h2>Role: {role.toUpperCase()}</h2>
            <button
                onClick={() => {//button that helps in switching the roles
                    const newRole = role === "editor" ? "creator" : "editor";
                    window.location.search = `?role=${newRole}`;
                }}
                className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Switch to {role === "editor" ? "CREATOR" : "EDITOR"}
            </button>

            <div style={{ display: "flex", gap: "20px" }}>
                {columns.map((col) => {//render each column
                    return (

                        <div key={col} style={{ width: "30%" }}>
                            <h3>{col.toUpperCase()}</h3>

                            {tasks//loops through all task
                                .filter((task) => task && task.column === col)//filter tasks that exist and belong to current column
                                .map((task) => (//render each filtered task
                                    <div
                                        key={task.id}//unique key for react reconcillation
                                        style={{//inline styling
                                            border: "1px solid #ccc",
                                            padding: "10px",
                                            marginBottom: "10px"
                                        }}
                                    >
                                        <b>{task.title}</b>
                                        <p>{task.priority} | {task.category}</p>

                                        {role === "editor" && (//input feild to edit task title
                                            <>
                                                <input
                                                    placeholder="Edit title"
                                                    onBlur={(e) =>
                                                        updateTaskTitle(task, e.target.value)
                                                    }
                                                />
                                                <button onClick={() => {//button to save updated task
                                                    setTitle(updateTaskTitle)
                                                }}>save update</button>

                                                <button onClick={() => deleteTask(task.id)}>
                                                    ❌ Delete
                                                </button>
                                            </>
                                        )}

                                        <br />

                                        <button type="button" onClick={() => moveTask(task.id, "todo")}>
                                            To Do
                                        </button> //
                                        <button type="button" onClick={() => moveTask(task.id, "in-progress")}>
                                            In Progress
                                        </button>
                                        <button type="button" onClick={() => {
                                            moveTask(task.id, "done")
                                        }}>
                                            Done
                                        </button>
                                    </div>
                                ))}
                        </div>
                    )
                })}

                {role === "creator" && (//chsnging role to creator window
                    <div style={{ width: "30%" }}>
                        <h3>Create Task</h3>

                        <input //setting task title
                            placeholder="Task title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        <select
                            value={priority}//selecting priority
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                        </select>

                        <select
                            value={category}//selecting category
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option>Bug</option>
                            <option>Feature</option>
                            <option>Enhancement</option>
                        </select>

                        <button //button ffor finally adding the task
                            onClick={createTask}>➕ Add</button>
                    </div>
                )}
            </div>

        </div>
    );
}
