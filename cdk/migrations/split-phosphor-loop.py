#!/usr/bin/env python3
"""Move existing hosting resources into PhosphorLoopStack without recreating them.

Run after `cdk synth` with an AWS identity allowed to update/refactor the stacks.
Generated templates and plans go outside the repo; never commit them.
Phases: prepare -> wait for stack update -> plan -> inspect -> execute -> CDK deploy.
The deployed source template is preserved for all unrelated website resources.
"""
import argparse
import copy
import json
from pathlib import Path
import subprocess

SOURCE = 'HostStack'
DESTINATION = 'PhosphorLoopStack'
MOVES = {
    'PhosphorLoopBucket955B807A': 'PhosphorLoopBucket955B807A',
    'PhosphorLoopBucketPolicy7AFCFA67': 'PhosphorLoopBucketPolicy7AFCFA67',
    'SiteDistributionOrigin2S3OriginDE814F1B': 'PhosphorLoopOriginAccessIdentityC73020E8',
    'PhosphorLoopDeployRole90F7451B': 'PhosphorLoopDeployRole90F7451B',
    'PhosphorLoopDeployRoleDefaultPolicy68C49694': 'PhosphorLoopDeployRoleDefaultPolicy68C49694',
}
INVALIDATION_POLICY = 'PhosphorLoopInvalidationPolicy5EB2948D'


def aws(*args):
    return json.loads(subprocess.check_output(['aws', 'cloudformation', *args, '--output', 'json']))


def rewrite(value, replacements):
    key = json.dumps(value, sort_keys=True)
    if key in replacements:
        return copy.deepcopy(replacements[key])
    if isinstance(value, dict):
        return {k: rewrite(v, replacements) for k, v in value.items()}
    if isinstance(value, list):
        return [rewrite(v, replacements) for v in value]
    return value


def renamed_refs(value, ids):
    replacements = {}
    # References used by these five resources; attribute names are collected recursively.
    def collect(node):
        if isinstance(node, dict):
            if node.get('Ref') in ids:
                replacements[json.dumps(node, sort_keys=True)] = {'Ref': ids[node['Ref']]}
            if 'Fn::GetAtt' in node and node['Fn::GetAtt'][0] in ids:
                resource, attribute = node['Fn::GetAtt']
                replacements[json.dumps(node, sort_keys=True)] = {'Fn::GetAtt': [ids[resource], attribute]}
            for child in node.values():
                collect(child)
        elif isinstance(node, list):
            for child in node:
                collect(child)
    collect(value)
    return rewrite(value, replacements)


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('phase', choices=['prepare', 'plan', 'inspect', 'execute'])
parser.add_argument('--workdir', type=Path, required=True, help='Temporary directory outside the repository')
args = parser.parse_args()
repo = Path(__file__).resolve().parents[2]
work = args.workdir.resolve()
if work.is_relative_to(repo):
    parser.error('Generated migration artifacts must stay outside the repository')
work.mkdir(parents=True, exist_ok=True)

if args.phase in ('inspect', 'execute'):
    refactor = json.loads((work / 'refactor.json').read_text())['StackRefactorId']
    if args.phase == 'inspect':
        print(json.dumps(aws('describe-stack-refactor', '--stack-refactor-id', refactor), indent=2))
        print(json.dumps(aws('list-stack-refactor-actions', '--stack-refactor-id', refactor), indent=2))
    else:
        status = aws('describe-stack-refactor', '--stack-refactor-id', refactor)
        assert status['Status'] == 'CREATE_COMPLETE', status
        actions = aws('list-stack-refactor-actions', '--stack-refactor-id', refactor)['StackRefactorActions']
        resources = [a for a in actions if a['Entity'] == 'RESOURCE']
        assert len(resources) == len(MOVES), actions
        assert all(a['Action'] == 'MOVE' for a in resources), actions
        assert all(a['Entity'] == 'RESOURCE' or (a['Entity'] == 'STACK' and a['Action'] == 'CREATE') for a in actions), actions
        assert {a['ResourceMapping']['Source']['LogicalResourceId']: a['ResourceMapping']['Destination']['LogicalResourceId'] for a in resources} == MOVES, actions
        subprocess.run(['aws', 'cloudformation', 'execute-stack-refactor', '--stack-refactor-id', refactor], check=True)
    raise SystemExit()

live = aws('get-template', '--stack-name', SOURCE)['TemplateBody']
if isinstance(live, str):
    live = json.loads(live)
(work / 'host-before.json').write_text(json.dumps(live, indent=2))
assembly = Path(__file__).resolve().parents[1] / 'cdk.out'
app = json.loads((assembly / f'{DESTINATION}.template.json').read_text())
host = json.loads((assembly / f'{SOURCE}.template.json').read_text())
reverse_ids = {destination: source for source, destination in MOVES.items()}
# Resolve final cross-stack imports back to their current local references during preparation.
imports_to_local = {
    json.dumps({'Fn::ImportValue': output['Export']['Name']}, sort_keys=True): renamed_refs(output['Value'], reverse_ids)
    for output in app['Outputs'].values() if 'Export' in output
}

if args.phase == 'prepare':
    # CloudFormation refactors cannot add resources or modify properties. Split the
    # invalidation policy first, and align the OAI's descriptive comment in advance.
    desired = copy.deepcopy(live)
    role_policy = 'PhosphorLoopDeployRoleDefaultPolicy68C49694'
    oai = 'SiteDistributionOrigin2S3OriginDE814F1B'
    for old_id in (role_policy, oai):
        desired['Resources'][old_id]['Properties'] = renamed_refs(app['Resources'][MOVES[old_id]]['Properties'], reverse_ids)
    desired['Resources'][INVALIDATION_POLICY] = rewrite(host['Resources'][INVALIDATION_POLICY], imports_to_local)
    path = work / 'host-prepared.json'
    path.write_text(json.dumps(desired))
    result = aws('create-change-set', '--stack-name', SOURCE, '--change-set-name', 'prepare-phosphor-stack-split',
                 '--change-set-type', 'UPDATE', '--capabilities', 'CAPABILITY_NAMED_IAM',
                 '--template-body', f'file://{path}', '--parameters', 'ParameterKey=BootstrapVersion,UsePreviousValue=true')
    (work / 'preparation.json').write_text(json.dumps(result))
    print(json.dumps(result, indent=2))
    print('Inspect this change set, then execute it and wait for UPDATE_COMPLETE before planning the refactor.')
else:
    assert INVALIDATION_POLICY in live['Resources'], 'Execute preparation first'
    # Reuse the LIVE website template so local Gatsby assets, metadata and other
    # unrelated resources cannot accidentally enter the migration.
    after_host = copy.deepcopy(live)
    for old_id in MOVES:
        del after_host['Resources'][old_id]
    after_host['Outputs'] = host['Outputs']
    local_to_imports = {json.dumps(value, sort_keys=True): json.loads(key) for key, value in imports_to_local.items()}
    after_host = rewrite(after_host, local_to_imports)
    after_app = {'Resources': {}, 'Outputs': app['Outputs']}
    for old_id, new_id in MOVES.items():
        after_app['Resources'][new_id] = renamed_refs(live['Resources'][old_id], MOVES)
    # The only changes are ownership and references; a regular subsequent CDK
    # deployment adds bootstrap metadata/parameters and normalizes construct paths.
    mappings = [{'Source': {'StackName': SOURCE, 'LogicalResourceId': old},
                 'Destination': {'StackName': DESTINATION, 'LogicalResourceId': new}}
                for old, new in MOVES.items()]
    request = {'Description': 'Split Phosphor Loop hosting into its own CDK stack',
               'EnableStackCreation': True,
               'StackDefinitions': [{'StackName': SOURCE, 'TemplateBody': json.dumps(after_host)},
                                    {'StackName': DESTINATION, 'TemplateBody': json.dumps(after_app)}],
               'ResourceMappings': mappings}
    path = work / 'request.json'
    path.write_text(json.dumps(request))
    result = aws('create-stack-refactor', '--cli-input-json', f'file://{path}')
    (work / 'refactor.json').write_text(json.dumps(result))
    print(json.dumps(result, indent=2))
