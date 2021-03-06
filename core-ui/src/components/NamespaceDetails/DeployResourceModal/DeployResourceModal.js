import React from 'react';
import PropTypes from 'prop-types';

import {
  FileInput,
  Modal,
  useMicrofrontendContext,
  useConfig,
} from 'react-shared';
import { Button } from 'fundamental-react';
import { useNotification } from 'react-shared';
import { parseFile, getResourceUrl } from './deployResourceHelpers';

DeployResourceModal.propTypes = { name: PropTypes.string.isRequired };

export default function DeployResourceModal({ name }) {
  const { idToken } = useMicrofrontendContext();
  const { fromConfig } = useConfig();
  const notification = useNotification();
  const [error, setError] = React.useState(null);
  const [contents, setContents] = React.useState(null);

  const fileInputChanged = async file => {
    const [content, error] = await parseFile(file);
    setContents(content);
    setError(error);
  };

  const deployResource = async () => {
    const promises = contents.map(async content => {
      const url = getResourceUrl(
        fromConfig('domain'),
        content.kind,
        content.apiVersion,
        name,
      );
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(content),
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        const { message } = await res.json();
        throw Error(message);
      }
    });

    const results = await Promise.allSettled(promises);
    const succeeded = results.filter(r => r.status === 'fulfilled');

    if (results.length === succeeded.length) {
      notification.notifySuccess({
        content: 'Successfully deployed new resource(s)',
      });
    } else {
      const failedCount = results.length - succeeded.length;
      const firstError = results.filter(r => r.status !== 'fulfilled')[0]
        .reason;
      notification.notifyError(
        {
          content: `Could not deploy resources: (${failedCount}/${results.length} failed). ${firstError}`,
        },
        15000,
      );
    }
  };

  const modalOpeningComponent = (
    <Button glyph="add">Deploy new resource</Button>
  );

  return (
    <Modal
      title="Deploy new resource"
      modalOpeningComponent={modalOpeningComponent}
      confirmText="Deploy"
      cancelText="Cancel"
      onConfirm={deployResource}
      disabledConfirm={!contents || !!error}
      onShow={() => setContents(null) || setError(null)}
    >
      <form>
        <FileInput
          fileInputChanged={fileInputChanged}
          availableFormatsMessage="Select YAML or JSON file"
          acceptedFileFormats=".yml,.yaml,.json"
          required
        />
        {error && (
          <p
            className="fd-has-color-status-3 fd-has-margin-top-tiny"
            role="alert"
          >
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
