import Route from 'Common/Types/API/Route';
import Page from 'CommonUI/src/Components/Page/Page';
import React, { FunctionComponent, ReactElement } from 'react';
import PageMap from '../../Utils/PageMap';
import RouteMap from '../../Utils/RouteMap';
import PageComponentProps from '../PageComponentProps';
import DashboardSideMenu from './SideMenu';
import ModelTable from 'CommonUI/src/Components/ModelTable/ModelTable';
import Label from 'Common/Models/Label';
import TableColumnType from 'CommonUI/src/Components/Table/Types/TableColumnType';
import FormFieldSchemaType from 'CommonUI/src/Components/Forms/Types/FormFieldSchemaType';

const APIKeys: FunctionComponent<PageComponentProps> = (
    __props: PageComponentProps
): ReactElement => {
    return (
        <Page
            title={'Project Settings'}
            breadcrumbLinks={[
                {
                    title: 'Project Name',
                    to: RouteMap[PageMap.HOME] as Route,
                },
                {
                    title: 'Settings',
                    to: RouteMap[PageMap.SETTINGS] as Route,
                },
                {
                    title: 'Labels',
                    to: RouteMap[PageMap.SETTINGS_LABELS] as Route,
                },
            ]}
            sideMenu={<DashboardSideMenu />}
        >
            <ModelTable<Label>
                type={Label}
                model={new Label()}
                id="labels-table"
                isDeleteable={true}
                isEditable={true}
                isCreateable={true}
                itemsOnPage={10}
                cardProps={{
                    title: 'Labels',
                    description:
                        'Create, edit, delete your project labels here.',
                }}
                noItemsMessage={'No labels created for this project so far.'}
                formFields={[
                    {
                        field: {
                            name: true,
                        },
                        title: 'Name',
                        fieldType:
                            FormFieldSchemaType.Text,
                        required: true,
                        placeholder: "internal-service",
                        validation: {
                            noSpaces: true
                        }
                    },
                    {
                        field: {
                            description: true,
                        },
                        title: 'Description',
                        fieldType:
                            FormFieldSchemaType.LongText,
                        required: true,
                        placeholder: "This label is for all the internal services."
                    },
                    {
                        field: {
                            color: true,
                        },
                        title: 'Label Color',
                        fieldType:
                            FormFieldSchemaType.Color,
                        required: true,
                        placeholder: "Please select color for this label."
                    }
                ]}
                columns={[
                    {
                        field: {
                            color: true,
                        },
                        title: 'Name',
                        type: TableColumnType.Text,
                    },
                    {
                        field: {
                            description: true,
                        },
                        title: 'Description',
                        type: TableColumnType.Text,
                    },
                    {
                        title: 'Actions',
                        type: TableColumnType.Actions,
                    },
                ]}
            />
        </Page>
    );
};

export default APIKeys;
