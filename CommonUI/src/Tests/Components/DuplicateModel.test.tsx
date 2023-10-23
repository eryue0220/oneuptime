import React from 'react';
import BaseModel from 'Common/Models/BaseModel';
import Select from '../../Utils/ModelAPI/Select';
import { ModelField } from '../../Components/Forms/ModelForm';
import TableMetaData from 'Common/Types/Database/TableMetadata';
import IconProp from 'Common/Types/Icon/IconProp';
import {
    render,
    screen,
    within,
    fireEvent,
    waitFor,
} from '@testing-library/react';
import DuplicateModel from '../../Components/DuplicateModel/DuplicateModel';
import ObjectID from 'Common/Types/ObjectID';
import CrudApiEndpoint from 'Common/Types/Database/CrudApiEndpoint';
import { act } from 'react-test-renderer';
import Route from 'Common/Types/API/Route';

@TableMetaData({
    tableName: 'Foo',
    singularName: 'Foo',
    pluralName: 'Foos',
    icon: IconProp.Wrench,
    tableDescription: 'A test model',
})
@CrudApiEndpoint(new Route('/testModel'))
class TestModel extends BaseModel {
    public changeThis?: string = 'original';
}

jest.mock('../../Utils/ModelAPI/ModelAPI', () => {
    return {
        getItem: jest
            .fn()
            .mockResolvedValueOnce({
                changeThis: 'changed',
                setValue: function (key: 'changeThis', value: string) {
                    this[key] = value;
                },
                removeValue: jest.fn(),
            })
            .mockResolvedValueOnce({
                changeThis: 'changed',
                setValue: function (key: 'changeThis', value: string) {
                    this[key] = value;
                },
                removeValue: jest.fn(),
            })
            .mockResolvedValueOnce(undefined),
        create: jest
            .fn()
            .mockResolvedValueOnce({
                data: {
                    id: 'foobar',
                    changeThis: 'changed',
                },
            })
            .mockResolvedValueOnce(undefined),
    };
});

jest.mock('../../Utils/Navigation', () => {
    return {
        navigate: jest.fn(),
    };
});

describe('DuplicateModel', () => {
    const fieldsToDuplicate: Select<TestModel> = {};
    const fieldsToChange: Array<ModelField<TestModel>> = [
        {
            field: {
                changeThis: true,
            },
            title: 'Change This',
            required: false,
            placeholder: 'You can change this',
        },
    ];
    it('renders correctly', () => {
        render(
            <DuplicateModel
                modelType={TestModel}
                modelId={new ObjectID('foo')}
                fieldsToDuplicate={fieldsToDuplicate}
                fieldsToChange={fieldsToChange}
            />
        );
        expect(
            document.querySelector('#payment-details-heading')?.textContent
        ).toBe('Duplicate Foo');
        expect(document.querySelector('h2')?.textContent).toBe('Duplicate Foo');
        expect(
            document.querySelector('p.mt-1.text-sm.text-gray-500')?.textContent
        ).toBe(
            'Duplicating this foo will create another foo exactly like this one.'
        );
        expect(document.querySelector('button')?.textContent).toBe(
            'Duplicate Foo'
        );
    });
    it('shows confirmation modal when duplicate button is clicked', () => {
        render(
            <DuplicateModel
                modelType={TestModel}
                modelId={new ObjectID('foo')}
                fieldsToDuplicate={fieldsToDuplicate}
                fieldsToChange={fieldsToChange}
            />
        );
        const button: HTMLElement = screen.getByRole('button', {
            name: 'Duplicate Foo',
        });
        fireEvent.click(button);
        expect(screen.getByRole('dialog')).toBeDefined();
        expect(
            screen.getByRole('dialog').querySelectorAll('h3')[0]?.textContent
        ).toBe('Duplicate Foo');
        expect(
            screen.getByRole('dialog').querySelectorAll('h3')[1]?.textContent
        ).toBe('Are you sure you want to duplicate this foo?');
        expect(
            screen.getByRole('dialog').querySelectorAll('button')[1]
                ?.textContent
        ).toBe('Duplicate Foo');
        expect(
            screen.getByRole('dialog').querySelectorAll('button')[2]
                ?.textContent
        ).toBe('Close');
    });
    it('duplicates item when confirmation button is clicked', async () => {
        const onDuplicateSuccess: (item: TestModel) => void = jest.fn();
        render(
            <DuplicateModel
                modelType={TestModel}
                modelId={new ObjectID('foo')}
                fieldsToDuplicate={fieldsToDuplicate}
                fieldsToChange={fieldsToChange}
                onDuplicateSuccess={onDuplicateSuccess}
                navigateToOnSuccess={new Route('/done')}
            />
        );
        const button: HTMLElement = screen.getByRole('button', {
            name: 'Duplicate Foo',
        });
        void act(() => {
            fireEvent.click(button);
        });
        const dialog: HTMLElement = screen.getByRole('dialog');
        const confirmationButton: HTMLElement = within(dialog).getByRole(
            'button',
            {
                name: 'Duplicate Foo',
            }
        );
        void act(() => {
            fireEvent.click(confirmationButton);
        });
        await waitFor(() => {
            return expect(onDuplicateSuccess).toBeCalledWith({
                id: 'foobar',
                changeThis: 'changed',
            });
        });
        await waitFor(() => {
            return expect(
                require('../../Utils/Navigation').navigate
            ).toBeCalledWith(new Route('/done/foobar'));
        });
    });
    it('closes confirmation dialog when close button is clicked', () => {
        const onDuplicateSuccess: (item: TestModel) => void = jest.fn();
        render(
            <DuplicateModel
                modelType={TestModel}
                modelId={new ObjectID('foo')}
                fieldsToDuplicate={fieldsToDuplicate}
                fieldsToChange={fieldsToChange}
                onDuplicateSuccess={onDuplicateSuccess}
                navigateToOnSuccess={new Route('/done')}
            />
        );
        const button: HTMLElement = screen.getByRole('button', {
            name: 'Duplicate Foo',
        });
        void act(() => {
            fireEvent.click(button);
        });
        const dialog: HTMLElement = screen.getByRole('dialog');
        const closeButton: HTMLElement = within(dialog).getByRole('button', {
            name: 'Close',
        });
        void act(() => {
            fireEvent.click(closeButton);
        });
        expect(screen.queryByRole('dialog')).toBeFalsy();
    });
    it('handles could not create error correctly', async () => {
        const onDuplicateSuccess: (item: TestModel) => void = jest.fn();
        render(
            <DuplicateModel
                modelType={TestModel}
                modelId={new ObjectID('foo')}
                fieldsToDuplicate={fieldsToDuplicate}
                fieldsToChange={fieldsToChange}
                onDuplicateSuccess={onDuplicateSuccess}
                navigateToOnSuccess={new Route('/done')}
            />
        );
        const button: HTMLElement = screen.getByRole('button', {
            name: 'Duplicate Foo',
        });
        void act(() => {
            fireEvent.click(button);
        });
        const dialog: HTMLElement = screen.getByRole('dialog');
        const confirmationButton: HTMLElement = within(dialog).getByRole(
            'button',
            {
                name: 'Duplicate Foo',
            }
        );
        void act(() => {
            fireEvent.click(confirmationButton);
        });
        await screen.findByText('Duplicate Error');
        expect(
            screen.getByRole('dialog').querySelector('h3')?.textContent
        ).toBe('Duplicate Error');
        expect(
            screen
                .getByRole('dialog')
                .querySelector('.modal-body>div.text-gray-500.mt-5.text-sm')
                ?.textContent
        ).toBe('Error: Could not create Foo');
        expect(
            screen.getByRole('dialog').querySelector('button')?.textContent
        ).toBe('Close');
    });
    it('handles item not found error correctly', async () => {
        const onDuplicateSuccess: (item: TestModel) => void = jest.fn();
        render(
            <DuplicateModel
                modelType={TestModel}
                modelId={new ObjectID('foo')}
                fieldsToDuplicate={fieldsToDuplicate}
                fieldsToChange={fieldsToChange}
                onDuplicateSuccess={onDuplicateSuccess}
                navigateToOnSuccess={new Route('/done')}
            />
        );
        const button: HTMLElement = screen.getByRole('button', {
            name: 'Duplicate Foo',
        });
        void act(() => {
            fireEvent.click(button);
        });
        const dialog: HTMLElement = screen.getByRole('dialog');
        const confirmationButton: HTMLElement = within(dialog).getByRole(
            'button',
            {
                name: 'Duplicate Foo',
            }
        );
        void act(() => {
            fireEvent.click(confirmationButton);
        });
        await screen.findByText('Duplicate Error');
        expect(
            screen.getByRole('dialog').querySelector('h3')?.textContent
        ).toBe('Duplicate Error');
        expect(
            screen
                .getByRole('dialog')
                .querySelector('.modal-body>div.text-gray-500.mt-5.text-sm')
                ?.textContent
        ).toBe('Error: Could not find Foo with id foo');
        expect(
            screen.getByRole('dialog').querySelector('button')?.textContent
        ).toBe('Close');
    });
    it('closes error dialog when close button is clicked', async () => {
        const onDuplicateSuccess: (item: TestModel) => void = jest.fn();
        render(
            <DuplicateModel
                modelType={TestModel}
                modelId={new ObjectID('foo')}
                fieldsToDuplicate={fieldsToDuplicate}
                fieldsToChange={fieldsToChange}
                onDuplicateSuccess={onDuplicateSuccess}
                navigateToOnSuccess={new Route('/done')}
            />
        );
        const button: HTMLElement = screen.getByRole('button', {
            name: 'Duplicate Foo',
        });
        void act(() => {
            fireEvent.click(button);
        });
        const dialog: HTMLElement = screen.getByRole('dialog');
        const confirmationButton: HTMLElement = within(dialog).getByRole(
            'button',
            {
                name: 'Duplicate Foo',
            }
        );
        void act(() => {
            fireEvent.click(confirmationButton);
        });
        await screen.findByText('Duplicate Error');
        const errorDialog: HTMLElement = screen.getByRole('dialog');
        const closeButton: HTMLElement = within(errorDialog).getByRole(
            'button',
            {
                name: 'Close',
            }
        );
        void act(() => {
            fireEvent.click(closeButton);
        });
        expect(screen.queryByRole('dialog')).toBeFalsy();
    });
});
