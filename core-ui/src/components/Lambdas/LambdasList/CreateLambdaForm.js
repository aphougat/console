import React, { useState, useEffect } from 'react';
import LuigiClient from '@luigi-project/client';

import { LambdaNameInput, LabelsInput } from 'components/Lambdas/components';

import { useCreateLambda } from 'components/Lambdas/gql/hooks/mutations';

import { randomNameGenerator, validateFunctionName } from './helpers';

export default function CreateLambdaForm({
  onChange,
  formElementRef,
  setValidity = () => void 0,
  setInvalidModalPopupMessage = () => void 0,
  functionNames = [],
}) {
  const createLambda = useCreateLambda({ redirect: true });
  const [name, setName] = useState(randomNameGenerator());
  const [nameStatus, setNameStatus] = useState('');

  const [labels, setLabels] = useState({});

  useEffect(() => {
    const validationMessage = validateFunctionName(name, functionNames);
    setInvalidModalPopupMessage(validationMessage);
    setNameStatus(validationMessage);

    if (validationMessage) {
      setValidity(false);
    } else {
      setValidity(true);
    }
  }, [
    setValidity,
    setInvalidModalPopupMessage,
    setNameStatus,
    functionNames,
    name,
  ]);

  function updateName(event) {
    setName(event.target.value);
  }

  function updateLabels(newLabels) {
    setLabels(newLabels);
  }

  async function handleSubmit() {
    const inputData = {
      labels,
    };

    await createLambda({
      name: name,
      namespace: LuigiClient.getEventData().environmentId,
      inputData,
    });
  }

  return (
    <form
      ref={formElementRef}
      style={{ width: '30em' }}
      onChange={onChange}
      onSubmit={handleSubmit}
    >
      <LambdaNameInput
        id="lambdaName"
        value={name}
        onChange={updateName}
        nameStatus={nameStatus}
      />
      <LabelsInput labels={labels} onChange={updateLabels} />
    </form>
  );
}
