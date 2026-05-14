import React from 'react';
import { LiveEditor, LiveError, LivePreview, LiveProvider } from 'react-live';

type Props = {
  code: string;
  scope: Record<string, unknown>;
};

export function JsxLiveReact({ code, scope }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, padding: 12 }}>
      <LiveProvider code={code} scope={scope} language="jsx">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          <div style={{ border: '1px solid var(--vp-c-divider)', borderRadius: 8, overflow: 'hidden' }}>
            <LiveEditor style={{ fontFamily: 'var(--vp-font-family-mono)', fontSize: 13 }} />
          </div>
          <div style={{ border: '1px solid var(--vp-c-divider)', borderRadius: 8, padding: 12 }}>
            <LivePreview />
          </div>
          <div style={{ color: 'var(--vp-c-danger-1)', fontFamily: 'var(--vp-font-family-mono)', fontSize: 12 }}>
            <LiveError />
          </div>
        </div>
      </LiveProvider>
    </div>
  );
}

