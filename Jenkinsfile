pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh "$WORKSPACE/conf/scripts/install.sh"
            }
        }
        stage('Test') {
            steps {
                sh "$WORKSPACE/conf/scripts/test.sh"
            }
        }
        stage('Deploy') {
            steps {
                echo 'No deployments yet. Skipping.'
            }
        }
    }
}
