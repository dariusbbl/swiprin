import Modal from './Modal';
import Button from './Button';

export default function ConfirmModal({ open, onClose, onConfirm, title = 'Are you sure?', message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p style={{ color: 'var(--text-2)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
    </Modal>
  );
}
