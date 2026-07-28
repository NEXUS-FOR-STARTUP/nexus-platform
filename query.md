Query 1:

| package_name                       | package_id                           | count |
| ---------------------------------- | ------------------------------------ | ----- |
| Gói 2: Nhận xét + Sửa đổi (2 vòng) | 3b8d9b28-a5f7-47de-85fe-cb5586010a67 | 3     |
| Gói 1: Nhận xét 1 vòng             | 8f34e691-5022-4f2d-b423-2e25da71c088 | 2     |
| Audit 1 lượt                       | pkg_tf_audit                         | 1     |
| Gói 0: Sàng lọc ý tưởng            | 8e9289a4-e074-4fc4-9a43-42a3330c22f3 | 1     |

Query 2:

| id                                   | case_code | package_name                       | user_facing_stage  | payment_status | created_at              |
| ------------------------------------ | --------- | ---------------------------------- | ------------------ | -------------- | ----------------------- |
| ff4874c2-0797-4c94-9c30-d843bf6839d4 | NX-959112 | Gói 2: Nhận xét + Sửa đổi (2 vòng) | submitted          | unpaid         | 2026-07-07 14:41:54.15  |
| 48ff9de1-68fd-4042-a846-7c9986d28b9e | NX-326949 | Gói 2: Nhận xét + Sửa đổi (2 vòng) | triage_accepted    | paid           | 2026-07-07 07:44:23.205 |
| b8054667-f483-4983-bfdf-c11db3dbdf97 | NX-157851 | Gói 2: Nhận xét + Sửa đổi (2 vòng) | closed             | paid           | 2026-07-06 19:02:45.168 |
| d5a51e27-65bb-40aa-b2d8-51547985e79c | NX-697096 | Gói 1: Nhận xét 1 vòng             | closed             | paid           | 2026-07-06 14:34:40.571 |
| 7e901544-24b9-4324-870e-78c2e482dcd8 | NX-191011 | Gói 1: Nhận xét 1 vòng             | closed             | paid           | 2026-07-06 11:34:41.849 |
| 91eee6f2-bb9f-4505-9adc-58c7b7088ca5 | NX-312500 | Gói 0: Sàng lọc ý tưởng            | revision_submitted | not_required   | 2026-06-29 20:30:59.198 |

Query 3:

| id                                   | name                               | price  | is_active |
| ------------------------------------ | ---------------------------------- | ------ | --------- |
| 8e9289a4-e074-4fc4-9a43-42a3330c22f3 | Gói 0: Sàng lọc ý tưởng            | 0      | false     |
| 8f34e691-5022-4f2d-b423-2e25da71c088 | Gói 1: Nhận xét 1 vòng             | 149000 | false     |
| 3b8d9b28-a5f7-47de-85fe-cb5586010a67 | Gói 2: Nhận xét + Sửa đổi (2 vòng) | 249000 | false     |
| 1ec2916a-a2e9-4885-a441-f06d8f854ea4 | Gói 3: Đồng hành nhiều vòng        | 599000 | false     |
| pkg_tf_free                          | Team-fit Free                      | 0      | true      |
| pkg_tf_audit                         | Audit 1 lượt                       | 39000  | true      |

Query 4:

| table_name          | row_count |
| ------------------- | --------- |
| case_events         | 75        |
| sessions            | 21        |
| case_messages       | 19        |
| document_records    | 19        |
| lifecycle_units     | 13        |
| \_prisma_migrations | 12        |
| accounts            | 8         |
| payments            | 8         |
| users               | 8         |
| cases               | 7         |
| document_types      | 6         |
| checkpoints         | 6         |
| service_packages    | 6         |
| team_fit_reports    | 1         |
| two_factors         | 0         |
| case_members        | 0         |
| audit_rounds        | 0         |
| verifications       | 0         |
| ai_jobs             | 0         |
| refunds             | 0         |
| reports             | 0         |

Query 5:

| tbl              | cnt |
| ---------------- | --- |
| lifecycle_units  | 13  |
| checkpoints      | 6   |
| reports          | 0   |
| payments         | 7   |
| audit_rounds     | 0   |
| team_fit_reports | 0   |
| case_members     | 0   |
| document_records | 19  |
| case_events      | 74  |
| case_messages    | 19  |
