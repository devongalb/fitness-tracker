.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-top: 24px;
  align-items: stretch;
}

.quick-action-card {
  background: var(--card-alt);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 16px;
  min-width: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  box-sizing: border-box;
}

@media (max-width: 900px) {
  .quick-actions {
    grid-template-columns: 1fr;
  }
}