import { useState } from 'react';
import Modal from '../ui/Modal';
import RichTextEditor from '../ui/RichTextEditor';
import Button from '../ui/Button';
import styles from './RejectionNoteModal.module.css';

export default function RejectionNoteModal({ open, onClose, onConfirm, loading }) {
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    onConfirm(note);
    setNote('');
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Reject application" size="md">
      <div className={styles.wrap}>
        <p className={styles.hint}>
          Optionally leave a personalised message for the candidate explaining the decision.
          This replaces a rejection email and is visible in their applications.
        </p>
        <div className={styles.editorWrap}>
          <RichTextEditor
            value={note}
            onChange={setNote}
            placeholder="Write a rejection note… (optional)"
          />
        </div>
        <div className={styles.actions}>
          <Button variant="ghost" type="button" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger-soft" type="button" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Rejecting…' : 'Reject'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
