import { useEffect, useState } from 'react';
import { BountyBoard, type Task, TaskStatus } from '../frontend-integration';
import contractInfo from '../contract.json';
import TaskCard from '../components/TaskCard';
import toast from 'react-hot-toast';

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const bountyBoard = new BountyBoard(contractInfo);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const allTasks = await bountyBoard.getAllTasks();
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const filterButtons = [
    { label: 'All Tasks', value: 'all' as const },
    { label: 'Open', value: TaskStatus.OPEN },
    { label: 'Claimed', value: TaskStatus.CLAIMED },
    { label: 'Submitted', value: TaskStatus.SUBMITTED },
    { label: 'Approved', value: TaskStatus.APPROVED },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Browse Tasks</h1>
            <p className="text-gray-600 mt-2">
              Discover opportunities and earn ALGO by completing tasks
            </p>
          </div>

          <button
            onClick={loadTasks}
            className="btn-secondary"
          >
            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === btn.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {btn.label}
              <span className="ml-2 text-sm opacity-75">
                ({btn.value === 'all' 
                  ? tasks.length 
                  : tasks.filter(t => t.status === btn.value).length
                })
              </span>
            </button>
          ))}
        </div>

        {/* Tasks Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-20">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No tasks found</h3>
            <p className="mt-2 text-gray-600">
              {filter === 'all' 
                ? 'Be the first to create a task!' 
                : `No ${BountyBoard.getStatusLabel(filter as TaskStatus).toLowerCase()} tasks available.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <TaskCard key={task.taskId} task={task} />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card text-center">
            <div className="text-3xl font-bold text-indigo-600">{tasks.length}</div>
            <div className="text-gray-600 mt-1">Total Tasks</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-green-600">
              {tasks.filter(t => t.status === TaskStatus.OPEN).length}
            </div>
            <div className="text-gray-600 mt-1">Open Tasks</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600">
              {tasks.filter(t => t.status === TaskStatus.CLAIMED || t.status === TaskStatus.SUBMITTED).length}
            </div>
            <div className="text-gray-600 mt-1">In Progress</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-purple-600">
              {tasks.filter(t => t.status === TaskStatus.APPROVED).length}
            </div>
            <div className="text-gray-600 mt-1">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
