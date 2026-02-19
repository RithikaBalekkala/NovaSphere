import { Link } from 'react-router-dom';
import { type Task, TaskStatus, BountyBoard } from '../frontend-integration';
import { formatDistance } from 'date-fns';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.OPEN:
        return 'bg-green-100 text-green-800';
      case TaskStatus.CLAIMED:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.SUBMITTED:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.APPROVED:
        return 'bg-purple-100 text-purple-800';
      case TaskStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case TaskStatus.REFUNDED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    return BountyBoard.getStatusLabel(status);
  };

  const formatAmount = (amount: bigint) => {
    return BountyBoard.microToAlgo(amount).toFixed(2);
  };

  const formatDeadline = (deadline: bigint) => {
    const date = new Date(Number(deadline) * 1000);
    return formatDistance(date, new Date(), { addSuffix: true });
  };

  const isDeadlinePassed = () => {
    return BountyBoard.isDeadlinePassed(task.deadline);
  };

  return (
    <Link to={`/tasks/${task.taskId}`}>
      <div className="card hover:scale-[1.02] transition-transform cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex-1 pr-4">
            {task.title}
          </h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
            {getStatusLabel(task.status)}
          </span>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">
          {task.description}
        </p>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-indigo-600">
              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span className="font-bold text-lg">{formatAmount(task.amount)} ALGO</span>
            </div>

            <div className={`flex items-center ${isDeadlinePassed() ? 'text-red-500' : 'text-gray-500'}`}>
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{formatDeadline(task.deadline)}</span>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Task #{task.taskId}
          </div>
        </div>
      </div>
    </Link>
  );
}
