export default function ProgressBar({ current, total }) {
  const percent = Math.round((current / total) * 100);
  return (
    <div>
      <div className="progress">
        <div style={{ width: `${percent}%` }} />
      </div>
      <p>
        Progress: {current}/{total}
      </p>
    </div>
  );
}
