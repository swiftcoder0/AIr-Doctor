def test_trust_records_and_verify_first_queue(client):
    # 1. Fetch all trust records
    resp = client.get("/api/trust/records?base_id=all")
    assert resp.status_code == 200
    records = resp.json()
    assert len(records) >= 5

    # 2. Check for records needing review
    needs_review = [r for r in records if r["verification_status"] == "NEEDS_REVIEW"]
    assert len(needs_review) >= 1
    target = needs_review[0]
    target_id = target["id"]

    # 3. Verify record
    resp_verify = client.post(f"/api/trust/{target_id}/verify?reviewer=Air%20Commander")
    assert resp_verify.status_code == 200
    assert resp_verify.json()["verification_status"] == "VERIFIED"

    # 4. Check that audit ledger recorded the human verification
    resp_ledger = client.get("/api/ledger?base_id=all")
    assert resp_ledger.status_code == 200
    actions = [e["action"] for e in resp_ledger.json()]
    assert "VERIFY_DATA_TRUST_RECORD" in actions

def test_trust_record_rejection(client):
    resp = client.get("/api/trust/records?base_id=all")
    assert resp.status_code == 200
    records = resp.json()
    target = records[0]

    resp_reject = client.post(f"/api/trust/{target['id']}/reject?reviewer=Air%20Commander")
    assert resp_reject.status_code == 200
    assert resp_reject.json()["verification_status"] == "REJECTED"

    resp_ledger = client.get("/api/ledger?base_id=all")
    assert resp_ledger.status_code == 200
    actions = [e["action"] for e in resp_ledger.json()]
    assert "REJECT_ANOMALOUS_DATA_RECORD" in actions
